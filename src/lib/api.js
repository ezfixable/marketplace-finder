// src/lib/api.js
// Берём базовый URL бэкенда из ENV Vite.
// На Vercel переменная должна быть: VITE_BACKEND_URL = https://marketplace-finder.onrender.com
const BASE = (import.meta.env?.VITE_BACKEND_URL || '').replace(/\/+$/, '');

// Общий парсер ответа
const asJson = async (res) => {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
};

// ===== AUTH / FACEBOOK =====
export const apiStatus = () =>
  fetch(`${BASE}/api/auth/facebook/status`).then(asJson);

export const apiUploadCookies = (cookiesJsonObjectOrArray) =>
  fetch(`${BASE}/api/auth/facebook/cookies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // принимаем либо { cookies: [...] }, либо просто [...]
    body: JSON.stringify(cookiesJsonObjectOrArray),
  }).then(asJson);

// ===== SEARCH =====
export const apiSearch = (payload) =>
  fetch(`${BASE}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // ожидается тело вида:
    // {
    //   "query": "laptop",
    //   "category": "Electronics",
    //   "price_min": 100,
    //   "price_max": 1000,
    //   "location": "Los Angeles",
    //   "radius": 25,
    //   "condition": "Good",
    //   "date_range": "last_3d",
    //   "sort_by": "date_desc"
    // }
    body: JSON.stringify(payload),
  }).then(asJson);

// ===== SAVED SEARCHES =====
// создать сохранённый поиск
export const apiSavedCreate = (payload) =>
  fetch(`${BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // payload: { query: "...", filters: { ... } }
    body: JSON.stringify(payload),
  }).then(asJson);

// список сохранённых
export const apiSavedList = () =>
  fetch(`${BASE}/api/saved`).then(asJson);

// удалить один
export const apiSavedDelete = (id) =>
  fetch(`${BASE}/api/saved/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).then(asJson);

// переключение уведомлений ДЛЯ КОНКРЕТНОГО сохранённого поиска
// бекенд: PATCH /api/saved/{id}/notifications
// body-параметры могут быть любыми из:
// { email_enabled?: boolean, push_enabled?: boolean }
export const apiSavedPatchNotif = (id, body) =>
  fetch(`${BASE}/api/saved/${encodeURIComponent(id)}/notifications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(asJson);

// ===== GLOBAL SETTINGS (опционально, если добавишь на бэке) =====
// пример: включить/выключить глобальные email/pushover
export const apiSetGlobalNotify = (body) =>
  fetch(`${BASE}/api/settings/notifications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(asJson);
