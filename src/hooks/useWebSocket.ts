import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
	const navigate = useNavigate()
	const {
		startMatch,
		addGuess,
		addOpponentResult,
		setWinner,
		setHP,
		setOpponentForfeited,
		setIsRanked,
		setPendingChallenge,
		setPendingRematch,
		setRematchDeclined,
	} = useGameStore()
	const { user } = useAuthStore()

	useEffect(() => {
		if (!matchId || !user) return

		wsClient.connect(matchId)

		const onMatchFound = (e: WSEvent) => {
			const p = e.payload as MatchFoundPayload
			startMatch(p.match_id, false)
			wsClient.off('match_found', onMatchFound)
			wsClient.disconnect()
			navigate(`/game/${p.match_id}`, { state: { isPlayerA: p.is_player_a, isRanked: false }, replace: true })
		}

		const onGuessResult = (e: WSEvent) => {
			const guess = e.payload as Guess
			if (guess.player_id === user.id) addGuess(guess)
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
			const payload = e.payload as { player_id?: string }
			if (payload.player_id === user.id) {
				useGameStore.setState({ myGuesses: [] })
				return
			}
			useGameStore.setState({ opponentResults: [] })
		}

		const onGuessReset = (e: WSEvent) => {
			const p = e.payload as { reset: boolean }
			if (p.reset) useGameStore.setState({ myGuesses: [] })
		}

		const onOpponentLeft = () => {
			setOpponentForfeited(true)
			setWinner(user.id)
		}

		const onChallengeRequest = (e: WSEvent) =>
			setPendingChallenge(e.payload as ChallengeRequestPayload)

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
			wsClient.off('rematch_request', onRematchRequest)
			wsClient.off('rematch_declined', onRematchDeclined)
			wsClient.disconnect()
		}
	}, [addGuess, addOpponentResult, isPlayerA, matchId, navigate, setHP, setIsRanked, setOpponentForfeited, setPendingChallenge, setPendingRematch, setRematchDeclined, setWinner, startMatch, user])
}
