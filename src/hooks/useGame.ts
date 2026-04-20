import { useState, useCallback, useEffect } from "react";
import { api } from "../lib/api";
import { useGameStore } from "../store";
import { useWebSocket } from "./useWebSocket";

const WORD_LENGTH = 5
const MAX_GUESSES = 6

export function useGame(matchId: string, isPlayerA: boolean) {
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
    } = useGameStore()
    const [ currentInput, setCurrentInput ] = useState('')
    const [ error, setError] = useState<string | null>(null)
    const [ isSubmitting, setIsSubmitting] = useState(false)

    useWebSocket(matchId, isPlayerA)

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
            if (guess.result.every((tile) => tile === 'correct')) {
                resetMyBoard()
            } else {
                addGuess(guess)
            }
            setCurrentInput("")
        } catch (err: any) {
            setError( err.message ?? 'Something went wrong')
        } finally {
            setIsSubmitting(false)
        }
    }, [currentInput, matchId, isSubmitting, addGuess, resetMyBoard])
    
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

    const letterStates = myGuesses.reduce<Record<string, string>>((acc, guess) => {
        guess.result.forEach((r, i) => {
          const letter = guess.guess[i]
          if (acc[letter] === 'correct') return
          if (r === 'correct' || (r === 'present' && acc[letter] !== 'correct') || !acc[letter]) {
            acc[letter] = r ?? 'absent'
          }
        })
        return acc
    }, {})

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
      letterStates,
      handleKey,
      opponentForfeited,
      maxGuesses: MAX_GUESSES,
      wordLength: WORD_LENGTH,
    }
}
