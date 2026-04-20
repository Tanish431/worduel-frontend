import type { TileResult } from '../../types'

interface MiniRow {
  result: TileResult[]
}

function MiniRow({ result }: MiniRow) {
  return (
    <div className="mini-board__row">
      {result.map((r, i) => (
        <div key={i} className={`mini-tile mini-tile--${r ?? 'empty'}`} />
      ))}
    </div>
  )
}

interface OpponentPanelProps {
  opponentResults: TileResult[][]  // one array of 5 results per guess
  maxGuesses: number
  wordLength: number
}

export function OpponentPanel({ opponentResults, maxGuesses, wordLength }: OpponentPanelProps) {
  return (
    <div className="opponent-panel">
      <p className="opponent-panel__label">Opponent</p>
      <div className="mini-board">
        {Array.from({ length: maxGuesses }).map((_, i) => (
          opponentResults[i]
            ? <MiniRow key={i} result={opponentResults[i]} />
            : <MiniRow key={i} result={Array(wordLength).fill(null)} />
        ))}
      </div>
    </div>
  )
}