import type { Guess, TileResult } from "../../types";

interface TileProps {
    letter?: string;
    result?: TileResult;
    isCurrent?: boolean;
}   

function Tile({ letter, result, isCurrent }: TileProps) {
    const state = result || (isCurrent ? "tbd" : "empty");
    return (
        <div className={`tile tile--${state}`}>
            {letter?.toUpperCase()}
        </div>
    );
}

interface rowProps {
    guess?: Guess;
    currentInput?: string;
    wordLength: number;
}

function Row({ guess, currentInput, wordLength }: rowProps) {
    return (
        <div className="board__row">
            {Array.from({ length: wordLength }).map((_, i) => (
                guess ? (
                    <Tile key={i} letter={guess.guess[i]} result={guess.result[i]} />
                ) : (
                    <Tile key={i} letter={currentInput?.[i]} isCurrent={!!currentInput} />
                )
            ))}
        </div> 
    )
}

interface GameBoardProps {
  guesses: Guess[]
  currentInput: string
  maxGuesses: number
  wordLength: number
}

export function GameBoard({ guesses, currentInput, maxGuesses, wordLength }: GameBoardProps) {
  return (
    <div className="board">
      {Array.from({ length: maxGuesses }).map((_, i) => {
        if (i < guesses.length) return <Row key={i} guess={guesses[i]} wordLength={wordLength} />
        if (i === guesses.length) return <Row key={i} currentInput={currentInput} wordLength={wordLength} />
        return <Row key={i} wordLength={wordLength} />
      })}
    </div>
  )
}