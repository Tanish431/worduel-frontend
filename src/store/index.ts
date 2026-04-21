import { create } from "zustand";
import type { User, Guess, MatchStatus, TileResult, ChallengeRequestPayload, RematchRequestPayload} from '../types'

const storedToken = localStorage.getItem('token')

interface AuthSlice {
    user: User | null
    token: string | null
    authReady: boolean
    setAuth: (user: User, token: string) => void
    setUser: (user: User) => void
    setAuthReady: (ready: boolean) => void
    clearAuth: () => void
}

export const useAuthStore = create<AuthSlice>((set) => ({
    user: null,
    token: storedToken,
    authReady: !storedToken,
    setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, authReady: true })
    },
    setUser: (user) => set((state) => ({ user, authReady: true, token: state.token })),
    setAuthReady: (authReady) => set({ authReady }),
    clearAuth: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, authReady: true })
    }
}))

type GameStatus = MatchStatus | 'idle' | 'queuing'

interface GameSlice {
    matchId: string | null
    myGuesses: Guess[]
    opponentResults: TileResult[][]
    status: GameStatus
    winnerId: string | null
    myHP: number
    opponentHP: number
    opponentForfeited: boolean
    isRanked: boolean
    pendingChallenge: ChallengeRequestPayload | null
    challengeDeclined: boolean
    pendingRematch: RematchRequestPayload | null
    rematchDeclined: boolean
    setMatchId: (id: string) => void
    startMatch: (id: string, isRanked?: boolean) => void
    addGuess: (guess: Guess) => void
    addOpponentResult: (result: TileResult[]) => void
    resetMyBoard: () => void
    resetOpponentBoard: () => void
    setStatus: (s: GameStatus) => void
    setWinner: (id: string | null) => void
    setHP: (myHP: number, opponentHP: number) => void
    setOpponentForfeited: (v: boolean) => void
    setIsRanked: (v: boolean) => void
    setPendingChallenge: (c: ChallengeRequestPayload | null) => void
    setChallengeDeclined: (v: boolean) => void
    setPendingRematch: (r: RematchRequestPayload | null) => void
    setRematchDeclined: (v: boolean) => void
    resetGame: () => void
}

export const useGameStore = create<GameSlice>((set) => ({
  matchId: null,
  myGuesses: [],
  opponentResults: [],
  status: 'idle',
  winnerId: null,
  myHP: 100,
  opponentHP: 100,
  opponentForfeited: false,
  isRanked: true,
  pendingChallenge: null,
  challengeDeclined: false,
  pendingRematch: null,
  rematchDeclined: false,
  setMatchId: (id) => set({ matchId: id }),
  startMatch: (id, isRanked = true) => set({
    matchId: id,
    myGuesses: [],
    opponentResults: [],
    status: 'active',
    winnerId: null,
    myHP: 100,
    opponentHP: 100,
    opponentForfeited: false,
    isRanked,
    pendingRematch: null,
    rematchDeclined: false,
  }),
  addGuess: (guess) => set((s) => ({ myGuesses: [...s.myGuesses, guess] })),
  addOpponentResult: (result) => set((s) => ({ opponentResults: [...s.opponentResults, result] })),
  resetMyBoard: () => set({ myGuesses: [] }),
  resetOpponentBoard: () => set({ opponentResults: [] }),
  setStatus: (status) => set({ status }),
  setWinner: (id) => set({ winnerId: id, status: 'finished' }),
  setHP: (myHP, opponentHP) => set({ myHP, opponentHP }),
  setOpponentForfeited: (v) => set({ opponentForfeited: v }),
  setIsRanked: (v) => set({ isRanked: v }),
  setPendingChallenge: (c) => set({ pendingChallenge: c }),
  setChallengeDeclined: (v) => set({ challengeDeclined: v }),
  setPendingRematch: (r) => set({ pendingRematch: r }),
  setRematchDeclined: (v) => set({ rematchDeclined: v }),
  resetGame: () => set({
    matchId: null,
    myGuesses: [],
    opponentResults: [],
    status: 'idle',
    winnerId: null,
    myHP: 100,
    opponentHP: 100,
    opponentForfeited: false,
    isRanked: true,
    pendingChallenge: null,
    challengeDeclined: false,
    pendingRematch: null,
    rematchDeclined: false,
  }),
}))
