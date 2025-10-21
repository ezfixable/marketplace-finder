// /pages/Settings.jsx
import React, { useEffect, useState } from 'react';
import { getAuthStatus } from '../lib/api';

export default function Settings() {
  const [status, setStatus] = useState({ authenticated: false, message: 'Loading…' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAuthStatus()
      .then((data) => {
        if (!mounted) return;
        if (typeof data?.authenticated === 'boolean') {
          setStatus({ authenticated: data.authenticated, message: data.message || '' });
        } else {
          setStatus({ authenticated: false, message: 'Backend response invalid' });
        }
      })
      .catch(() => setStatus({ authenticated: false, message: 'Backend unreachable' }))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>

      <section className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-medium mb-2">Facebook Authentication</h2>

        {loading ? (
          <p>Checking…</p>
        ) : status.authenticated ? (
          <div className="text-green-600">Authenticated ✅ — {status.message}</div>
        ) : (
          <div className="text-red-600">Not authenticated ❌ — {status.message}</div>
        )}

        <p className="text-sm text-slate-500 mt-2">
          Uses Playwright session stored on backend. Upload cookies to backend if needed.
        </p>
      </section>

      <section className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-medium mb-2">Notifications</h2>
        <div className="text-sm text-slate-600">
          Email and Pushover toggles will appear when configured on backend.
        </div>
      </section>
    </div>
  );
}
