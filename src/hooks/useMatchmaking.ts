import { useEffect, useCallback } from 'react'
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

export function useMatchmaking() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const {
        startMatch,
        setStatus,
        setPendingChallenge,
        status,
    } = useGameStore()

    useEffect(() => {
        if (!user) return

        wsClient.connect(LOBBY_ID)

        const onMatchFound = (e: WSEvent) => {
            const p = e.payload as MatchFoundPayload
            startMatch(p.match_id, true)
            wsClient.disconnect()
            navigate(`/game/${p.match_id}`, { state: { isPlayerA: p.is_player_a, isRanked: true } })
        }

        const onChallengeRequest = (e: WSEvent) => {
            setPendingChallenge(e.payload as ChallengeRequestPayload)
        }

        wsClient.on('match_found', onMatchFound)
        wsClient.on('challenge_request', onChallengeRequest)
        return () => {
            wsClient.off('match_found', onMatchFound)
            wsClient.off('challenge_request', onChallengeRequest)
        }
    }, [navigate, setPendingChallenge, setStatus, startMatch, user])

    const joinQueue = useCallback(async () => {
        setStatus('queuing')
        try {
            await api.joinQueue()
        } catch (err) {
            setStatus('idle')
            throw err
        }
    }, [])

    const leaveQueue = useCallback( async () => {
        setStatus('idle')
        try { await api.leaveQueue() } catch {}
    },[])

    return {joinQueue, leaveQueue, isQueuing: status === 'queuing'}
}
