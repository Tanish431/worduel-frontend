import { useEffect } from 'react'
import { wsClient } from '../lib/ws'
import { useGameStore, useAuthStore } from '../store'
import type {
	WSEvent,
	Guess,
	OpponentGuessPayload,
	MatchOverPayload,
	MatchFoundPayload,
	ChallengeRequestPayload,
	RematchRequestPayload,
} from '../types'

interface HPUpdatePayload {
	player_a_hp: number
	player_b_hp: number
}

export function useWebSocket(matchId: string | null, isPlayerA: boolean) {
	const {
		addGuess,
		addOpponentResult,
		resetMyBoard,
		setWinner,
		setHP,
		setOpponentForfeited,
		setIsRanked,
		setOpponentUsername,
		setPendingChallenge,
		setChallengeDeclined,
		setPendingRematch,
		setRematchDeclined,
	} = useGameStore()
	const { user } = useAuthStore()

	useEffect(() => {
		if (!matchId || !user) return

		wsClient.connect(matchId)

		const onMatchFound = (e: WSEvent) => {
			const p = e.payload as MatchFoundPayload
			setOpponentUsername(p.opponent_username)
			setIsRanked(false)
		}

		const onGuessResult = (e: WSEvent) => {
			const guess = e.payload as Guess & { reset?: boolean }
			if (guess.player_id === user.id) {
				if (!guess.reset) {
					addGuess(guess)
				}
			}
		}

		const onOpponentGuess = (e: WSEvent) =>
			addOpponentResult((e.payload as OpponentGuessPayload).result)

		const onMatchOver = (e: WSEvent) => {
			const p = e.payload as MatchOverPayload
			setWinner(p.winner_id)
			setIsRanked(p.is_ranked)
		}

		const onHPUpdate = (e: WSEvent) => {
			const p = e.payload as HPUpdatePayload
			const myHP = isPlayerA ? p.player_a_hp : p.player_b_hp
			const opponentHP = isPlayerA ? p.player_b_hp : p.player_a_hp
			setHP(myHP, opponentHP)
		}

		const onWordSolved = (e: WSEvent) => {
			const payload = e.payload as { player_id?: string, reset?: boolean }
			if (payload.player_id === user.id) {
				if (payload.reset) {
					return
				}
				resetMyBoard()
				return
			}
			useGameStore.setState({ opponentResults: [] })
		}

		const onGuessReset = (e: WSEvent) => {
			const p = e.payload as { reset: boolean, my_hp: number; next_word_index: number }
			if (p.reset) {
				window.setTimeout(() => {
					resetMyBoard()
				}, 560)
			}
		}

		const onOpponentLeft = () => {
			setOpponentForfeited(true)
			setWinner(user.id)
		}

		const onChallengeRequest = (e: WSEvent) =>
			setPendingChallenge(e.payload as ChallengeRequestPayload)

		const onChallengeDeclined = (_e: WSEvent) => setChallengeDeclined(true)

		const onRematchRequest = (e: WSEvent) =>
			setPendingRematch(e.payload as RematchRequestPayload)

		const onRematchDeclined = () => setRematchDeclined(true)

		wsClient.on('match_found', onMatchFound)
		wsClient.on('guess_result', onGuessResult)
		wsClient.on('opponent_guess', onOpponentGuess)
		wsClient.on('match_over', onMatchOver)
		wsClient.on('hp_update', onHPUpdate)
		wsClient.on('word_solved', onWordSolved)
		wsClient.on('guess_reset', onGuessReset)
		wsClient.on('opponent_left', onOpponentLeft)
		wsClient.on('challenge_request', onChallengeRequest)
		wsClient.on('challenge_declined', onChallengeDeclined)
		wsClient.on('rematch_request', onRematchRequest)
		wsClient.on('rematch_declined', onRematchDeclined)

		return () => {
			wsClient.off('match_found', onMatchFound)
			wsClient.off('guess_result', onGuessResult)
			wsClient.off('opponent_guess', onOpponentGuess)
			wsClient.off('match_over', onMatchOver)
			wsClient.off('hp_update', onHPUpdate)
			wsClient.off('word_solved', onWordSolved)
			wsClient.off('guess_reset', onGuessReset)
			wsClient.off('opponent_left', onOpponentLeft)
			wsClient.off('challenge_request', onChallengeRequest)
			wsClient.off('challenge_declined', onChallengeDeclined)
			wsClient.off('rematch_request', onRematchRequest)
			wsClient.off('rematch_declined', onRematchDeclined)
			wsClient.disconnectIfMatch(matchId)
		}
	}, [addGuess, addOpponentResult, isPlayerA, matchId, resetMyBoard, setChallengeDeclined, setHP, setIsRanked, setOpponentForfeited, setOpponentUsername, setPendingChallenge, setPendingRematch, setRematchDeclined, setWinner, user])
}
