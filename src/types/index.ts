export type TileResult = 'correct' | 'present' | 'absent' | null

export interface User {
    id: string
    username: string
    elo: number
    created_at: string
}

export type MatchStatus = 'pending' | 'active' | 'finished'

export interface Match {
    id: string
    player_a_id: string
    player_b_id: string
    status: MatchStatus
    is_ranked: boolean
    winner_id?: string
    started_at: string
    finished_at?: string
}

export interface Guess{
    id: string
    match_id: string
    player_id: string
    word_index: number
    guess: string
    result: TileResult[]
    guessed_at: string
}

export interface MatchSummaryPlayer {
    id: string
    username: string
}

export interface MatchSummaryRound {
    word_index: number
    target_word: string
    player_a_guesses: Guess[]
    player_b_guesses: Guess[]
}

export interface MatchSummary {
    match_id: string
    is_ranked: boolean
    winner_id?: string | null
    player_a: MatchSummaryPlayer
    player_b: MatchSummaryPlayer
    rounds: MatchSummaryRound[]
}

export interface WSEvent<T = unknown> {
    type: string
    payload: T
}

export interface MatchFoundPayload {
    match_id: string
    opponent_id: string
    is_player_a: boolean
}

export interface MatchOverPayload {
    winner_id: string | null
    elo_delta: number
}

export interface OpponentGuessPayload{
    match_id: string
    player_id: string
    word_index: number
    result: TileResult[]
}

export interface LeaderboardEntry {
    rank: number
    username: string
    elo: number
    wins: number
    losses: number
    win_rate: number 
}

export interface HPUpdatePayload {
  player_a_hp: number
  player_b_hp: number
}

export interface MatchOverPayload {
  winner_id: string | null
  elo_delta: number
  is_ranked: boolean
}

export interface ChallengeRequestPayload {
  challenger_id: string
  challenger_username: string
}

export interface ChallengeDeclinedPayload {
  message: string
}

export interface RematchRequestPayload {
  match_id: string
  requester_id: string
}

export interface RematchDeclinedPayload {
  message: string
}
