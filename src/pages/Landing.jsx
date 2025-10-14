import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      localStorage.setItem('mock_user', JSON.stringify({ id:'mock_user_1', name:'Demo User', authenticated: true }))
      navigate('/search')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-transparent to-transparent">
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl sm:text-6xl font-display font-semibold tracking-tight">Find Your Perfect Deal on Facebook Marketplace</h1>
        <p className="mt-6 text-lg text-slate-600">Smart search, instant notifications, and saved profiles — all in one place.</p>
        <div className="mt-10">
          <button className="button-primary text-lg px-7 py-4" onClick={handleLogin} disabled={loading}>
            {loading ? 'Continuing…' : 'Continue with Facebook'}
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-20">
          {[
            {title:'Smart Search', desc:'Powerful filters across categories, price, location, and more.'},
            {title:'Instant Notifications', desc:'Email or push alerts when new listings match your search.'},
            {title:'Save Time', desc:'Store searches and rerun with a click.'},
          ].map((c, i) => (
            <div key={i} className="card border-slate-200 dark:border-slate-800 p-6 text-left">
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{c.desc}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 text-left">
          <h2 className="text-2xl font-display font-semibold">How It Works</h2>
          <ol className="mt-4 space-y-3 text-slate-700 dark:text-slate-300">
            <li><span className="font-semibold">1.</span> Authenticate and set your search preferences.</li>
            <li><span className="font-semibold">2.</span> Run searches and save profiles you want to track.</li>
            <li><span className="font-semibold">3.</span> Enable notifications to be alerted instantly.</li>
          </ol>
        </section>
      </div>
    </div>
  )
}
