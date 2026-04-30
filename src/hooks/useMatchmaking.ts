import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { wsClient } from '../lib/ws'
import { useGameStore, useAuthStore } from '../store'
import type {
    WSEvent,
    MatchFoundPayload,
    ChallengeRequestPayload,
} from '../types'

const LOBBY_ID = '00000000-0000-0000-0000-000000000000'
const QUEUE_TIMEOUT_MS = 90_000

export function useMatchmaking() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const {
        startMatch,
        setStatus,
        setOpponentUsername,
        setPendingChallenge,
        setChallengeDeclined,
        selectedMode,
        status,
    } = useGameStore()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
    }

    useEffect(() => {
        if (!user) return

        wsClient.connect(LOBBY_ID)

        const onMatchFound = (e: WSEvent) => {
            clearTimer()
            const p = e.payload as MatchFoundPayload
            startMatch(p.match_id, true)
            setStatus('active')
            setOpponentUsername(p.opponent_username)
            wsClient.off('match_found', onMatchFound)
            navigate(`/game/${p.match_id}`, { state: { isPlayerA: p.is_player_a, isRanked: true } })
        }

        const onChallengeRequest = (e: WSEvent) => {
            setPendingChallenge(e.payload as ChallengeRequestPayload)
        }

        const onChallengeDeclined = (_e: WSEvent) => {
            setChallengeDeclined(true)
        }

        wsClient.on('match_found', onMatchFound)
        wsClient.on('challenge_request', onChallengeRequest)
        wsClient.on('challenge_declined', onChallengeDeclined)
        return () => {
            wsClient.off('match_found', onMatchFound)
            wsClient.off('challenge_request', onChallengeRequest)
            wsClient.off('challenge_declined', onChallengeDeclined)
        }
    }, [navigate, setChallengeDeclined, setPendingChallenge, setStatus, startMatch, user])

    const joinQueue = useCallback(async () => {
        setStatus('queuing')
        try {
            await api.joinQueue(selectedMode)
            timerRef.current = setTimeout(async () => {
                setStatus('timeout')
                try { await api.leaveQueue() } catch { }
                wsClient.disconnect()
            }, QUEUE_TIMEOUT_MS)
        } catch (err) {
            setStatus('idle')
            throw err
        }
    }, [selectedMode])

    const leaveQueue = useCallback(async () => {
        clearTimer()
        setStatus('idle')
        try { await api.leaveQueue() } catch { }
        wsClient.disconnect()
    }, [])

    return { joinQueue, leaveQueue, isQueuing: status === 'queuing', timedOut: status === 'timeout' }
}
