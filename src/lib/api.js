// /lib/api.js
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

export const getAuthStatus = () => api('/api/auth/facebook/status');

export const postSearch = (body) =>
  api('/api/search', { method: 'POST', body: JSON.stringify(body) });

export const uploadCookies = (cookiesPayload) =>
  api('/api/auth/facebook/cookies', { method: 'POST', body: JSON.stringify(cookiesPayload) });

export default api;
