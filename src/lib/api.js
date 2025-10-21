// src/lib/api.js
const BASE = import.meta.env.VITE_BACKEND_URL || '';

async function api(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    ...opts,
  });
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// --- Auth ---
export const getAuthStatus = () => api('/api/auth/facebook/status');

// --- Search ---
// Имя, которого ждут страницы:
export const apiSearch = (body) =>
  api('/api/search', { method: 'POST', body: JSON.stringify(body) });

// Синоним (если где-то использовалось другое имя):
export const postSearch = apiSearch;

// --- Saved searches (на будущее/если уже вызываются где-то) ---
export const apiSavedCreate = (payload) =>
  api('/api/saved', { method: 'POST', body: JSON.stringify(payload) });

export const apiSavedList = () => api('/api/saved');

export const apiSavedDelete = (id) =>
  api(`/api/saved/${id}`, { method: 'DELETE' });

export const apiSavedToggle = (id, kind, enabled) =>
  api(`/api/saved/${id}/notifications`, {
    method: 'PATCH',
    body: JSON.stringify({ [kind]: enabled }),
  });

export default api;
