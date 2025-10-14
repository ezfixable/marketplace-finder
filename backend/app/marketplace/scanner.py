import os
from datetime import datetime
from typing import List, Dict, Any
from playwright.sync_api import sync_playwright

SESSION_FILE = "/tmp/fb_context.json"
FB_BASE = "https://www.facebook.com"
MARKETPLACE_SEARCH = "https://www.facebook.com/marketplace/?query={q}"

def ensure_session(p):
    browser = p.chromium.launch(headless=True)
    if os.path.exists(SESSION_FILE):
        context = browser.new_context(storage_state=SESSION_FILE)
        return browser, context
    # login first time
    context = browser.new_context()
    page = context.new_page()
    page.goto(FB_BASE)
    page.fill('input[name="email"]', os.getenv('FB_EMAIL', ''))
    page.fill('input[name="pass"]', os.getenv('FB_PASSWORD', ''))
    page.click('button[name="login"]')
    page.wait_for_load_state('networkidle')
    context.storage_state(path=SESSION_FILE)
    return browser, context

def search_marketplace(query: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    with sync_playwright() as p:
        browser, context = ensure_session(p)
        page = context.new_page()
        page.goto(MARKETPLACE_SEARCH.format(q=query or ""))
        page.wait_for_load_state('networkidle')
        try:
            page.wait_for_selector('a[role="link"][tabindex="0"]', timeout=15000)
        except Exception:
            pass

        cards = page.query_selector_all('div[role="article"]')
        items = []
        for card in cards[:20]:
            try:
                title_el = card.query_selector('span')
                title = title_el.inner_text() if title_el else "Listing"
                price_el = card.query_selector('span:has-text("$")')
                price = 0.0
                if price_el:
                    txt = price_el.inner_text().replace("$","").replace(",","").strip()
                    price = float(txt) if txt and txt.replace('.', '', 1).isdigit() else 0.0
                link_el = card.query_selector('a[role="link"][tabindex="0"]')
                url = link_el.get_attribute('href') if link_el else FB_BASE
                img_el = card.query_selector('img')
                img = img_el.get_attribute('src') if img_el else ''
                city = "—"

                items.append({
                    "marketplace_id": url.split('/')[-1],
                    "title": title,
                    "price": price,
                    "city": city,
                    "category": filters.get("category") or "Miscellaneous",
                    "image_url": img,
                    "url": url if url.startswith('http') else (FB_BASE + url),
                    "published_at": datetime.utcnow().isoformat(),
                    "condition": filters.get("condition", "Any"),
                })
            except Exception:
                continue

        context.storage_state(path=SESSION_FILE)
        browser.close()
        return items

def has_session() -> bool:
    return os.path.exists(SESSION_FILE)
