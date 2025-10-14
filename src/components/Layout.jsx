import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const { isDark, toggleTheme } = useTheme()
  const nav = useNavigate()
  const logout = () => { localStorage.removeItem('mock_user'); nav('/') }

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <header className="sticky top-0 z-20 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-4">
            <Link to="/search" className="text-sm font-semibold hover:underline">Search</Link>
            <Link to="/saved" className="text-sm font-semibold hover:underline">Saved</Link>
            <Link to="/settings" className="text-sm font-semibold hover:underline">Settings</Link>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="button-primary flex items-center gap-2 !py-2">
              {isDark ? <Sun size={16}/> : <Moon size={16}/>}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={logout} className="border rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900">
              <LogOut size={16}/><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-sm opacity-70">Marketplace Finder — Demo</footer>
    </div>
  )
}
