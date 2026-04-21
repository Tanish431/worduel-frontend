import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useMatchmaking } from '../hooks/useMatchmaking'
import { useAuthStore } from '../store'
import { PrivateMatchModal } from '../components/ui/PrivateMatchModal'

export function HomePage() {
    const { user, authReady, clearAuth } = useAuthStore()
    const { joinQueue, leaveQueue, isQueuing } = useMatchmaking()
    const [showPrivate, setShowPrivate] = useState(false)

    if (!authReady) return null
    if (!user) return <Navigate to="/login" replace />

    return (
        <div className="home-page">
            <header className="home-page__header">
                <h1>Worduel</h1>
                <div className="home-page__user">
                    <span>{user.username}</span>
                    <span className="home-page__elo">ELO {user.elo}</span>
                    <button className="btn btn--ghost" onClick={clearAuth}>Log out</button>
                </div>
            </header>

            <main className="home-page__main">
                {isQueuing ? (
                    <div className="queue-screen">
                    <div className="queue-screen__spinner" />
                    <p className="queue-screen__label">Finding opponent…</p>
                    <button className="btn btn--secondary" onClick={leaveQueue}>Cancel</button>
                    </div>
                ) : (
                    <div className="lobby">
                    <p className="lobby__tagline">1v1 Wordle. Real-time. Ranked.</p>
                    <button className="btn btn--primary btn--lg" onClick={joinQueue}>
                        Find Match
                    </button>
                    <button className="btn btn--ghost" onClick={() => setShowPrivate(true)}>
                        Private Match
                    </button>
                    </div>
              )}
            </main>
            
            {showPrivate && <PrivateMatchModal onClose={() => setShowPrivate(false)} />}
        </div>
    )
}
