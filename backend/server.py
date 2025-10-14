import os
from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.models import SearchRequest, AuthStatus
from app.marketplace.scanner import (
    search_marketplace,
    has_session,
    ensure_session_login,   # ручной логин через Playwright
)
from app.notifications.emailer import send_email
from app.notifications.pushover import push

# -----------------------------------------------------------------------------
# Env & app setup
# -----------------------------------------------------------------------------
load_dotenv()
MONGO_URL = os.getenv("MONGO_URL")
PORT = int(os.getenv("PORT", "8001"))

app = FastAPI(title="Marketplace Finder API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # при желании сузить до домена Vercel
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
# Facebook Auth (GET/POST to be clickable from browser)
# -----------------------------------------------------------------------------
@app.api_route("/api/auth/facebook/login", methods=["GET", "POST"])
async def fb_login(request: Request):
    """
    Тригерит Playwright-логин по FB_EMAIL/FB_PASSWORD и сохраняет cookie-сессию.
    Работает и по GET (удобно из браузера), и по POST.
    Возвращает 200 всегда, чтобы фронт мог показать сообщение пользователю.
    """
    ok = ensure_session_login()
    if not ok:
        return {
            "authenticated": False,
            "message": "Login failed. Check FB_EMAIL/FB_PASSWORD or 2FA.",
        }
    return {"authenticated": True, "message": "Login successful. Session saved."}

@app.get("/api/auth/facebook/status", response_model=AuthStatus)
async def fb_status():
    return AuthStatus(
        authenticated=has_session(),
        message=(
            "Logged in (session found)"
            if has_session()
            else "Not authenticated. Run Playwright login once on the backend."
        ),
    )

# -----------------------------------------------------------------------------
# Search (never throws 500)
# -----------------------------------------------------------------------------
@app.post("/api/search")
async def api_search(payload: SearchRequest):
    """
    Выполняет поиск на FB Marketplace. Любая ошибка -> пустой результат,
    чтобы не было 500 и фронт не падал.
    """
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
                # email опционален, только если настроены SMTP env
                send_email(
                    os.getenv("SMTP_USER") or "you@example.com",
                    "New Marketplace item",
                    title,
                )
        except Exception as e:
            print(f"[periodic_scan error] {e}")
