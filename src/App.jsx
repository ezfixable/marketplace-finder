import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './pages/Landing'
import Search from './pages/Search'
import Saved from './pages/Saved'
import Settings from './pages/Settings'

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('mock_user')
  return user ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><Saved /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </ThemeProvider>
  )
}
