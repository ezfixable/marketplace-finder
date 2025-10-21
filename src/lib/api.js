// src/lib/api.js
// Базовый URL бэкенда из ENV Vite (Vercel: VITE_BACKEND_URL=https://marketplace-finder.onrender.com)
const BASE = (import.meta.env?.VITE_BACKEND_URL || '').replace(/\/+$/, '');

// Универсальный парсер ответа
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
    body: JSON.stringify(payload),
  }).then(asJson);

// ===== SAVED SEARCHES =====
export const apiSavedCreate = (payload) =>
  fetch(`${BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(asJson);

export const apiSavedList = () =>
  fetch(`${BASE}/api/saved`).then(asJson);

export const apiSavedDelete = (id) =>
  fetch(`${BASE}/api/saved/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }).then(asJson);

// ВОТ ЭТОГО ЭКСПОРТА НЕ ХВАТАЛО — добавляем
export const apiSavedPatchNotif = (id, body) =>
  fetch(`${BASE}/api/saved/${encodeURIComponent(id)}/notifications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(asJson);

// ===== GLOBAL SETTINGS (если реализуешь на бэке) =====
export const apiSetGlobalNotify = (body) =>
  fetch(`${BASE}/api/settings/notifications`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then(asJson);
