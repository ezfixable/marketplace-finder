import os
import json
from datetime import datetime
from typing import Any, Dict, List, Union

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.models import SearchRequest, AuthStatus
from app.marketplace.scanner import (
    search_marketplace,
    has_session,
    ensure_session_login,  # может не сработать при 2FA
)

from app.notifications.emailer import send_email
from app.notifications.pushover import push

SESSION_FILE = "/tmp/fb_context.json"

# -----------------------------------------------------------------------------
# Env & app setup
# -----------------------------------------------------------------------------
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
PORT = int(os.getenv("PORT", "8001"))

app = FastAPI(title="Marketplace Finder API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # сузить при желании до домена Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URL) if MONGO_URL else None
db = client.mpf if client else None

scheduler = AsyncIOScheduler()

# -----------------------------------------------------------------------------
# Lifecycle
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def on_start():
    try:
        scheduler.start()
    except Exception:
        pass

# -----------------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

# -----------------------------------------------------------------------------
# Facebook Auth: GET/POST login (может не сработать при 2FA)
# -----------------------------------------------------------------------------
@app.api_route("/api/auth/facebook/login", methods=["GET", "POST"])
async def fb_login(request: Request):
    ok = False
    try:
        ok = ensure_session_login()
    except Exception as e:
        print(f"[fb_login ERROR] {e}")
    if not ok:
        return {
            "authenticated": False,
            "message": "Login failed (FB_EMAIL/FB_PASSWORD or 2FA/Checkpoint). Prefer cookies upload.",
        }
    return {"authenticated": True, "message": "Login successful. Session saved."}

@app.get("/api/auth/facebook/status", response_model=AuthStatus)
async def fb_status():
    return AuthStatus(
        authenticated=has_session(),
        message=(
            "Logged in (session found)"
            if has_session()
            else "Not authenticated. Upload cookies or run login."
        ),
    )

# -----------------------------------------------------------------------------
# Facebook Auth via COOKIES (рекомендуется при 2FA)
# -----------------------------------------------------------------------------
def _normalize_cookies_to_storage_state(raw: Union[List[Dict[str, Any]], Dict[str, Any]]) -> Dict[str, Any]:
    """
    Принимает либо:
      - список cookie объектов (как экспортируют расширения типа EditThisCookie),
      - либо объект со структурой {"cookies": [...]}.
    Возвращает storage_state формата Playwright: {"cookies":[...], "origins":[]}
    """
    if isinstance(raw, dict) and "cookies" in raw and isinstance(raw["cookies"], list):
        cookies_in = raw["cookies"]
    elif isinstance(raw, list):
        cookies_in = raw
    else:
        raise ValueError("Invalid cookies payload; must be list or {'cookies': [...]}")

    cookies_out = []
    for c in cookies_in:
        try:
            name = c.get("name") or c.get("Name") or c.get("key")
            value = c.get("value") or c.get("Value")
            domain = c.get("domain") or c.get("Domain")
            path = c.get("path") or c.get("Path") or "/"
            expires = c.get("expires") or c.get("expirationDate") or None
            httpOnly = bool(c.get("httpOnly") or c.get("HttpOnly") or c.get("http_only") or False)
            secure = bool(c.get("secure") or c.get("Secure") or False)
            sameSite = c.get("sameSite") or c.get("SameSite") or "Lax"

            # Пропускаем пустые/битые
            if not (name and value and domain):
                continue

            # Приведём sameSite к ожидаемым значениям
            samesite_map = {"lax": "Lax", "strict": "Strict", "none": "None"}
            ss = samesite_map.get(str(sameSite).lower(), "Lax")

            cookie = {
                "name": name,
                "value": value,
                "domain": domain,
                "path": path,
                "httpOnly": httpOnly,
                "secure": secure,
                "sameSite": ss,
            }
            if expires is not None:
                try:
                    cookie["expires"] = int(expires)
                except Exception:
                    pass

            cookies_out.append(cookie)
        except Exception:
            continue

    return {"cookies": cookies_out, "origins": []}

@app.post("/api/auth/facebook/cookies")
async def fb_upload_cookies(body: Any):
    """
    Принимает cookies JSON (список или объект с ключом 'cookies') и сохраняет
    Playwright storage_state в SESSION_FILE. После этого статус станет authenticated:true.
    """
    try:
        # FastAPI уже парсит JSON; если пришла строка — попробуем распарсить вручную
        payload = body
        if isinstance(body, str):
            payload = json.loads(body)

        storage_state = _normalize_cookies_to_storage_state(payload)
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(storage_state, f)
        return {"authenticated": True, "saved": True, "cookies": len(storage_state.get("cookies", []))}
    except Exception as e:
        return {"authenticated": False, "saved": False, "error": str(e)}

@app.post("/api/auth/facebook/clear")
async def fb_clear_session():
    try:
        if os.path.exists(SESSION_FILE):
            os.remove(SESSION_FILE)
        return {"ok": True, "message": "Session cleared."}
    except Exception as e:
        return {"ok": False, "error": str(e)}

# -----------------------------------------------------------------------------
# Search (never throws 500)
# -----------------------------------------------------------------------------
@app.post("/api/search")
async def api_search(payload: SearchRequest):
    try:
        items = search_marketplace(payload.query or "", payload.model_dump())
        return {"listings": items, "total": len(items), "query": payload.query or ""}
    except Exception as e:
        return {
            "listings": [],
            "total": 0,
            "query": payload.query or "",
            "error": str(e),
        }

# -----------------------------------------------------------------------------
# Saved searches (Mongo)
# -----------------------------------------------------------------------------
@app.get("/api/saved")
async def saved_all():
    if not db:
        return []
    cur = db.saved_searches.find().sort("created_at", -1)
    return [{**x, "_id": str(x.get("_id"))} async for x in cur]

@app.post("/api/saved")
async def saved_create(body: Dict[str, Any]):
    if not db:
        raise HTTPException(500, "Mongo not configured")
    doc = {
        "query": body.get("query", ""),
        "filters": body.get("filters", {}),
        "notifications_enabled": True,
        "notifications": {"email": False, "push": False},
        "created_at": datetime.utcnow(),
    }
    res = await db.saved_searches.insert_one(doc)
    doc["_id"] = str(res.inserted_id)
    return doc

@app.patch("/api/saved/{sid}/notifications")
async def saved_patch(sid: str, body: Dict[str, Any]):
    if not db:
        raise HTTPException(500, "Mongo not configured")
    from bson import ObjectId
    await db.saved_searches.update_one(
        {"_id": ObjectId(sid)},
        {"$set": {f"notifications.{k}": v for k, v in body.items()}},
    )
    doc = await db.saved_searches.find_one({"_id": ObjectId(sid)})
    return doc.get("notifications", {})

@app.delete("/api/saved/{sid}")
async def saved_delete(sid: str):
    if not db:
        raise HTTPException(500, "Mongo not configured")
    from bson import ObjectId
    await db.saved_searches.delete_one({"_id": ObjectId(sid)})
    return {"ok": True}

# -----------------------------------------------------------------------------
# Periodic notifications example
# -----------------------------------------------------------------------------
@scheduler.scheduled_job("interval", minutes=10)
async def periodic_scan():
    if not db:
        return
    async for ss in db.saved_searches.find({"notifications_enabled": True}):
        try:
            items = search_marketplace(ss.get("query", ""), ss.get("filters", {}))
            if items:
                title = items[0]["title"]
                push("Marketplace Finder", f"New item: {title}")
                send_email(
                    os.getenv("SMTP_USER") or "you@example.com",
                    "New Marketplace item",
                    title,
                )
        except Exception as e:
            print(f"[periodic_scan error] {e}")
