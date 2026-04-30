import { useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";
import { formatErrorMessage } from "../lib/errors";
import { useGameStore } from "../store";
import { useWebSocket } from "./useWebSocket";

const WORD_LENGTH = 5
const MAX_GUESSES = 6

export function useGame(matchId: string, isPlayerA: boolean, liveEnabled: boolean) {
  const {
    myGuesses,
    opponentResults,
    status,
    winnerId,
    myHP,
    opponentHP,
    addGuess,
    resetMyBoard,
    opponentForfeited,
    letterStates,
    updateLetterStates,
  } = useGameStore()
  const [currentInput, setCurrentInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [solvedAt, setSolvedAt] = useState(0)
  const [failedAt, setFailedAt] = useState(0)

  useWebSocket(liveEnabled ? (matchId || null) : null, isPlayerA)

  const addLetter = useCallback((letter: string) => {
    setCurrentInput((s) => s.length < WORD_LENGTH ? s + letter.toLowerCase() : s)
    setError(null)
  }, [])

  const deleteLetter = useCallback(() => {
    setCurrentInput((s) => s.slice(0, -1))
  }, [])

  const submitGuess = useCallback(async () => {
    if (currentInput.length !== WORD_LENGTH || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const guess = await api.submitGuess(matchId, currentInput)
      updateLetterStates(currentInput, guess.result)
      if (guess.result.every((tile) => tile === 'correct')) {
        setSolvedAt(Date.now())
        resetMyBoard()
      } else {
        addGuess(guess)
        if (myGuesses.length + 1 === MAX_GUESSES) {
          setFailedAt(Date.now())
        }
      }
      setCurrentInput("")
    } catch (err: any) {
      setError(formatErrorMessage(err.message))
    } finally {
      setIsSubmitting(false)
    }
  }, [currentInput, matchId, isSubmitting, addGuess, resetMyBoard, myGuesses.length, updateLetterStates])

  useEffect(() => {
    setSolvedAt(0)
    setFailedAt(0)
  }, [matchId])

  useEffect(() => {
    if (myGuesses.length === 0) {
      setCurrentInput('')
      setError(null)
    }
  }, [myGuesses.length])

  const handleKey = useCallback((key: string) => {
    if (status !== 'active') return
    if (key === 'Enter') submitGuess()
    else if (key === 'Backspace') deleteLetter()
    else if (/^[a-zA-Z]$/.test(key)) addLetter(key)
  }, [status, submitGuess, deleteLetter, addLetter])

  return {
    currentInput,
    myGuesses,
    opponentResults,
    status,
    winnerId,
    myHP,
    opponentHP,
    error,
    isSubmitting,
    solvedAt,
    failedAt,
    letterStates,
    handleKey,
    opponentForfeited,
    maxGuesses: MAX_GUESSES,
    wordLength: WORD_LENGTH,
  }
}
