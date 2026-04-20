import type { User, Match, Guess, LeaderboardEntry, MatchSummary } from '../types'

const BASE = '/api'

function authHeader(): HeadersInit {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}`} : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
            ...init.headers
        },
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
    }
    return res.json()
}

export const api = {
    register: (username: string, email: string, password: string) =>
        request<{ token: string; user: User}> ('/auth/register', {
            method: 'POST',
            body: JSON.stringify({username, email, password})
        }),

    login: (email: string, password: string) =>
        request<{ token: string; user: User}> ('/auth/login', {
            method: 'POST',
            body: JSON.stringify({email, password})
        }),
    
    getMe: () => request<User>('/me'),

    joinQueue: () =>
        fetch('/api/match/queue', {
            method: 'POST',
            headers: { ...authHeader() },
    }).then((res) => { if (!res.ok) throw new Error(res.statusText) }),

    leaveQueue: () =>
        fetch('/api/match/queue', {
            method: 'DELETE',
            headers: { ...authHeader() },
    }).then((res) => { if (!res.ok) throw new Error(res.statusText) }),
    getMatch: (matchId: string) => request<Match>(`/match/${matchId}`),
    getMatchSummary: (matchId: string) => request<MatchSummary>(`/match/${matchId}/summary`),

    submitGuess: (matchId: string, guess: string) => 
        request<Guess>(`/match/${matchId}/guess`, {
            method:'POST',
            body: JSON.stringify({ guess }),
        }),

    forfeitMatch: (matchId: string) =>
        fetch(`${BASE}/match/${matchId}/forfeit`, {
            method: 'POST',
            headers: { ...authHeader() },
        }).then((res) => { if (!res.ok) throw new Error(res.statusText) }),
    
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
