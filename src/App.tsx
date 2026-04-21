import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { GamePage } from './pages/GamePage'
import { GoogleAuthCallbackPage } from './pages/GoogleAuthCallbackPage'
import { ChallengeNotification } from './components/ui/ChallengeNotification'
import { api } from './lib/api'
import { useAuthStore } from './store'

function AuthBootstrap() {
  const { authReady, token, user, setUser, setAuthReady, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!token || user) {
      setAuthReady(true)
      return
    }

    let cancelled = false

    const restoreSession = async () => {
      try {
        const currentUser = await api.getMe()
        if (cancelled) return
        setUser(currentUser)
      } catch {
        if (cancelled) return
        clearAuth()
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [clearAuth, setAuthReady, setUser, token, user])

  if (authReady) return null

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Loading Session</h2>
        <p className="auth-card__status">Restoring your account…</p>
      </div>
    </div>
  )
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, authReady } = useAuthStore()

  if (!authReady) return null
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <ChallengeNotification />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
        <Route path="/game/:matchId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}
