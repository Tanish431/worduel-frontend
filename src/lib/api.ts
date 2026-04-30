import type { User, Match, Guess, LeaderboardEntry, MatchSummary, MatchHistoryEntry } from '../types'
import { formatErrorMessage } from './errors'

const BASE = import.meta.env.VITE_API_URL ?? '/api'
const GOOGLE_CALLBACK_PATH = '/auth/google/callback'

function authHeader(): HeadersInit {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
}
export function getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem('device_id', deviceId)
    }
    return deviceId
}
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
            ...init.headers
        },
    })
    if (!res.ok) {
        try {
            const json = await res.json()
            throw new Error(formatErrorMessage(json.error ?? res.statusText))
        } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                throw e
            }
            throw new Error(formatErrorMessage(res.statusText))
        }

    }
    return res.json()
}

export const api = {
    getGoogleAuthUrl: () => {
        const redirectUri = `${window.location.origin}${GOOGLE_CALLBACK_PATH}`
        return `${BASE}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`
    },

    register: (username: string, email: string, password: string) =>
        request<{ token: string; user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        }),

    login: (email: string, password: string) =>
        request<{ token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }),

    getMeWithToken: (token: string) =>
        request<User>('/me', {
            headers: { Authorization: `Bearer ${token}` },
        }),

    getMe: () => request<User>('/me'),
    updateUsername: (username: string) =>
        request<{ username: string }>('/me/username', {
            method: 'PATCH',
            body: JSON.stringify({ username }),
        }),
    guestLogin: () => {
        const deviceId = getOrCreateDeviceId()
        return request<{ token: string; user: User }>('/auth/guest', {
            method: 'POST',
            body: JSON.stringify({ device_id: deviceId }),
        })
    },
    getStats: () => request<{ connected_users: number; users_in_game: number }>('/stats'),

    getHistory: (params?: {
        limit?: number
        offset?: number
        result?: 'win' | 'loss' | 'draw'
        game_mode?: 'easy' | 'hard'
        is_ranked?: boolean
        opponent?: string
        date_range?: 'week' | 'month' | 'all'
    }) => {
        const query = new URLSearchParams()
        if (params?.limit) query.set('limit', String(params.limit))
        if (params?.offset) query.set('offset', String(params.offset))
        if (params?.result) query.set('result', params.result)
        if (params?.game_mode) query.set('game_mode', params.game_mode)
        if (params?.is_ranked !== undefined) query.set('is_ranked', String(params.is_ranked))
        if (params?.opponent) query.set('opponent', params.opponent)
        if (params?.date_range) query.set('date_range', params.date_range)
        return request<{ matches: MatchHistoryEntry[]; total: number; offset: number; limit: number }>(
            `/me/matches?${query.toString()}`
        )
    },

    joinQueue: (gameMode: 'easy' | 'hard') =>
        fetch('/api/match/queue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...authHeader()
            },
            body: JSON.stringify({ game_mode: gameMode }),
        }).then((res) => { if (!res.ok) throw new Error(formatErrorMessage(res.statusText)) }),

    leaveQueue: () =>
        fetch(`${BASE}/match/queue`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { ...authHeader() },
        }).then((res) => { if (!res.ok) throw new Error(formatErrorMessage(res.statusText)) }),
    getMatch: (matchId: string) => request<Match>(`/match/${matchId}`),
    getMatchSummary: (matchId: string) => request<MatchSummary>(`/match/${matchId}/summary`),

    submitGuess: (matchId: string, guess: string) =>
        request<Guess>(`/match/${matchId}/guess`, {
            method: 'POST',
            body: JSON.stringify({ guess }),
        }),

    forfeitMatch: (matchId: string) =>
        fetch(`${BASE}/match/${matchId}/forfeit`, {
            method: 'POST',
            credentials: 'include',
            headers: { ...authHeader() },
        }).then((res) => { if (!res.ok) throw new Error(formatErrorMessage(res.statusText)) }),

    createRoom: () =>
        request<{ code: string }>('/room', { method: 'POST' }),

    joinRoom: (code: string) =>
        request<{ match_id: string }>(`/room/${code}/join`, { method: 'POST' }),

    // Challenge
    challengeUser: (username: string) =>
        request<{ message: string }>(`/challenge/${username}`, { method: 'POST' }),

    respondChallenge: (challengerId: string, accept: boolean) =>
        request<{ message: string; match_id?: string }>('/challenge/respond', {
            method: 'POST',
            body: JSON.stringify({ challenger_id: challengerId, accept }),
        }),

    // Rematch
    requestRematch: (matchId: string) =>
        request<{ message: string }>(`/match/${matchId}/rematch`, { method: 'POST' }),

    respondRematch: (matchId: string, requesterId: string, accept: boolean) =>
        request<{ message: string }>(`/match/${matchId}/rematch/respond`, {
            method: 'POST',
            body: JSON.stringify({ requester_id: requesterId, accept }),
        }),

    getLeaderboard: () => request<LeaderboardEntry[]>('/leaderboad'),
}
