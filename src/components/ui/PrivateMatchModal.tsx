import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { wsClient } from '../../lib/ws'
import { useGameStore } from '../../store'
import type { WSEvent, MatchFoundPayload } from '../../types'

interface Props {
  onClose: () => void
}

const LOBBY_ID = '00000000-0000-0000-0000-000000000000'

type Tab = 'create' | 'join' | 'challenge'

export function PrivateMatchModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { startMatch, challengeDeclined, setChallengeDeclined } = useGameStore()
  const [tab, setTab] = useState<Tab>('create')
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [challengeSent, setChallengeSent] = useState(false)

  useEffect(() => {
    if (!challengeDeclined) return
    wsClient.disconnect()
    setChallengeSent(false)
    setLoading(false)
    setError('Challenge was declined.')
    setChallengeDeclined(false)
  }, [challengeDeclined, setChallengeDeclined])

  const listenForMatch = () => {
    wsClient.connect(LOBBY_ID)
    const onMatchFound = (e: WSEvent) => {
      const p = e.payload as MatchFoundPayload
      startMatch(p.match_id, false)
      wsClient.off('match_found', onMatchFound)
      wsClient.disconnect()
      navigate(`/game/${p.match_id}`, { state: { isPlayerA: p.is_player_a, isRanked: false } })
    }
    wsClient.on('match_found', onMatchFound)
  }

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.createRoom()
      setCode(res.code)
      setWaiting(true)
      listenForMatch()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (joinCode.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      listenForMatch()
      await api.joinRoom(joinCode.toUpperCase())
    } catch (err: any) {
      setError(err.message)
      wsClient.disconnect()
    } finally {
      setLoading(false)
    }
  }

  const handleChallenge = async () => {
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    setChallengeDeclined(false)
    try {
      listenForMatch()
      await api.challengeUser(username.trim())
      setChallengeSent(true)
    } catch (err: any) {
      setError(err.message)
      wsClient.disconnect()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__tabs">
          <button
            className={`modal__tab ${tab === 'create' ? 'modal__tab--active' : ''}`}
            onClick={() => setTab('create')}
          >
            Create
          </button>
          <button
            className={`modal__tab ${tab === 'join' ? 'modal__tab--active' : ''}`}
            onClick={() => setTab('join')}
          >
            Join
          </button>
          <button
            className={`modal__tab ${tab === 'challenge' ? 'modal__tab--active' : ''}`}
            onClick={() => setTab('challenge')}
          >
            Challenge
          </button>
        </div>

        {error && <p className="auth-card__error">{error}</p>}

        {tab === 'create' && (
          <div className="modal__content">
            {!waiting ? (
              <>
                <p className="modal__desc">Create a private room and share the code with a friend.</p>
                <button className="btn btn--primary" onClick={handleCreate} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Room'}
                </button>
              </>
            ) : (
              <>
                <p className="modal__desc">Share this code with your friend:</p>
                <div className="room-code">{code}</div>
                <p className="modal__desc">Waiting for opponent to join…</p>
                <div className="queue-screen__spinner" />
              </>
            )}
          </div>
        )}

        {tab === 'join' && (
          <div className="modal__content">
            <p className="modal__desc">Enter the 6-character room code:</p>
            <input
              className="input input--code"
              placeholder="XXXXXX"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            />
            <button
              className="btn btn--primary"
              onClick={handleJoin}
              disabled={loading || joinCode.length !== 6}
            >
              {loading ? 'Joining…' : 'Join Room'}
            </button>
          </div>
        )}

        {tab === 'challenge' && (
          <div className="modal__content">
            {!challengeSent ? (
              <>
                <p className="modal__desc">Challenge a player directly by username.</p>
                <input
                  className="input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
                />
                <button
                  className="btn btn--primary"
                  onClick={handleChallenge}
                  disabled={loading || !username.trim()}
                >
                  {loading ? 'Sending…' : 'Send Challenge'}
                </button>
              </>
            ) : (
              <>
                <p className="modal__desc">Challenge sent to <strong>{username}</strong>!</p>
                <p className="modal__desc">Waiting for them to accept…</p>
                <div className="queue-screen__spinner" />
              </>
            )}
          </div>
        )}

        <button className="modal__close" onClick={onClose}>✕</button>
      </div>
    </div>
  )
}
