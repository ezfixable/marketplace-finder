# Backend (FastAPI + Mongo + Playwright)

## Render (без Docker)
- Root Directory: backend
- Build: pip install -r requirements.txt && python -m playwright install --with-deps chromium
- Start: uvicorn server:app --host 0.0.0.0 --port 8001
- Env: MONGO_URL, PORT=8001, FB_EMAIL, FB_PASSWORD, SMTP_*, PUSHOVER_*

## Проверка
- GET /api/health -> {"ok": true}
- GET /api/auth/facebook/status -> Not authenticated (до первого входа)
