import os
from datetime import datetime
from typing import List, Dict, Any, Union
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

SESSION_FILE = "/tmp/fb_context.json"
FB_BASE = "https://m.facebook.com"  # mobile проще
MARKETPLACE_SEARCH = "https://m.facebook.com/marketplace/?query={q}"

LAUNCH_ARGS = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-setuid-sandbox",
]

def _launch(p):
    return p.chromium.launch(headless=True, args=LAUNCH_ARGS)

def _new_context(browser):
    if os.path.exists(SESSION_FILE):
        return browser.new_context(storage_state=SESSION_FILE)
    return browser.new_context()

def ensure_session_login() -> bool:
    """Пытается создать storage_state из FB_EMAIL/FB_PASSWORD. Возвращает True при успехе."""
    if os.path.exists(SESSION_FILE):
        return True
    email = os.getenv("FB_EMAIL", "")
    password = os.getenv("FB_PASSWORD", "")
    if not email or not password:
        return False
    with sync_playwright() as p:
        browser = _launch(p)
        context = browser.new_context()
        page = context.new_page()
        try:
            page.goto(f"{FB_BASE}/login", wait_until="domcontentloaded", timeout=30000)
            page.fill('input[name="email"]', email)
            page.fill('input[name="pass"]', password)
            try:
                page.click('button[name="login"]', timeout=5000)
            except PWTimeout:
                page.keyboard.press("Enter")
            page.wait_for_load_state("networkidle", timeout=30000)
            context.storage_state(path=SESSION_FILE)
            browser.close()
            return True
        except Exception as e:
            print(f"[FB LOGIN ERROR] {e}")
            browser.close()
            return False

def has_session() -> bool:
    return os.path.exists(SESSION_FILE)

def search_marketplace(query: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Всегда возвращает список, даже при ошибке (тогда пустой)."""
    _ = ensure_session_login()  # не критично, если не получится

    try:
        with sync_playwright() as p:
            browser = _launch(p)
            context = _new_context(browser)
            page = context.new_page()
            url = MARKETPLACE_SEARCH.format(q=(query or "").strip())
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            try:
                page.wait_for_selector("article, div[role='article']", timeout=15000)
            except PWTimeout:
                pass

            cards = page.query_selector_all("article, div[role='article']")
            items: List[Dict[str, Any]] = []

            for card in cards[:30]:
                try:
                    title_el = card.query_selector("span, strong")
                    title = (title_el.inner_text().strip() if title_el else "Listing")
                    price_el = card.query_selector("span:has-text('$')")
                    price = 0.0
                    if price_el:
                        raw = price_el.inner_text().replace("$", "").replace(",", "").strip()
                        price = float(raw) if raw and raw.replace(".", "", 1).isdigit() else 0.0

                    link_el = card.query_selector("a[href*='/marketplace/item/']")
                    url_rel = link_el.get_attribute("href") if link_el else "/marketplace/"
                    full_url = url_rel if url_rel.startswith("http") else (FB_BASE + url_rel)

                    img_el = card.query_selector("img")
                    img = img_el.get_attribute("src") if img_el else ""

                    city = "—"

                    items.append({
                        "marketplace_id": full_url.split("/")[-1],
                        "title": title,
                        "price": price,
                        "city": city,
                        "category": filters.get("category") or "Miscellaneous",
                        "image_url": img,
                        "url": full_url,
                        "published_at": datetime.utcnow().isoformat(),
                        "condition": filters.get("condition", "Any"),
                    })
                except Exception:
                    continue

            try:
                context.storage_state(path=SESSION_FILE)
            except Exception:
                pass
            browser.close()
            return items
    except Exception as e:
        print(f"[SEARCH ERROR] {e}")
        return []
