import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { apiSavedList, apiSavedDelete, apiSavedPatchNotif } from '../lib/api'

export default function Saved() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await apiSavedList()
      setItems(data || [])
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const removeItem = async (id) => {
    await apiSavedDelete(id)
    setItems(items.filter(i => i._id !== id))
  }

  const toggleNotif = async (id, field, value) => {
    await apiSavedPatchNotif(id, { [field]: value })
    setItems(items.map(i => i._id === id ? { ...i, notifications: { ...(i.notifications||{}), [field]: value } } : i))
  }

  return (
    <Layout>
      <h2 className="text-2xl font-display font-semibold mb-4">Saved Searches</h2>
      {loading ? <div>Loading…</div> : (
        <div className="space-y-3">
          {items.length === 0 && <div className="opacity-70">No saved searches yet.</div>}
          {items.map(item => (
            <div key={item._id} className="card border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{item.query || '(no query)'}</div>
                <div className="text-sm opacity-75">{item.filters?.category || 'Any'} • {item.filters?.location || '—'} • {item.filters?.date_range || 'any'}</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.notifications?.email || false} onChange={e => toggleNotif(item._id, 'email', e.target.checked)}/>
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.notifications?.push || false} onChange={e => toggleNotif(item._id, 'push', e.target.checked)}/>
                  Push
                </label>
                <button className="button-primary" onClick={()=>{ /* could re-run search using item.filters */ }}>Run</button>
                <button className="border rounded-xl px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={()=>removeItem(item._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
