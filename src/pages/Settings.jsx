import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { apiAuthStatus } from '../lib/api'

export default function Settings() {
  const [authStatus, setAuthStatus] = useState({ authenticated: false, message: 'Mock only' })
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [smtp, setSmtp] = useState({ host:'', port:'', user:'', pass:'' })
  const [pushover, setPushover] = useState({ userKey:'', appToken:'' })

  useEffect(() => { apiAuthStatus().then(setAuthStatus) }, [])

  return (
    <Layout>
      <h2 className="text-2xl font-display font-semibold mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="card border-slate-200 dark:border-slate-800 p-4">
          <h3 className="font-semibold">Facebook Authentication</h3>
          <div className="text-sm opacity-80 mt-1">{authStatus.message}</div>
          <div className="mt-3">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className={`w-2 h-2 rounded-full ${authStatus.authenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">{authStatus.authenticated ? 'Authenticated' : 'Not authenticated (mock)'}</span>
            </div>
          </div>
        </div>

        <div className="card border-slate-200 dark:border-slate-800 p-4">
          <h3 className="font-semibold">Notifications</h3>
          <div className="mt-3 space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={emailEnabled} onChange={e=>setEmailEnabled(e.target.checked)}/>
              Enable Email
            </label>
            {emailEnabled && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="SMTP Host" value={smtp.host} onChange={e=>setSmtp({...smtp, host:e.target.value})}/>
                <input placeholder="SMTP Port" value={smtp.port} onChange={e=>setSmtp({...smtp, port:e.target.value})}/>
                <input placeholder="SMTP Username" value={smtp.user} onChange={e=>setSmtp({...smtp, user:e.target.value})}/>
                <input placeholder="SMTP Password" value={smtp.pass} onChange={e=>setSmtp({...smtp, pass:e.target.value})} type="password"/>
              </div>
            )}

            <label className="flex items-center gap-2 mt-4">
              <input type="checkbox" checked={pushEnabled} onChange={e=>setPushEnabled(e.target.checked)}/>
              Enable Pushover Push
            </label>
            {pushEnabled && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Pushover User Key" value={pushover.userKey} onChange={e=>setPushover({...pushover, userKey:e.target.value})}/>
                <input placeholder="Pushover App Token" value={pushover.appToken} onChange={e=>setPushover({...pushover, appToken:e.target.value})}/>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
