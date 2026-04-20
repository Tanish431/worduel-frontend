const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
]

interface KeyboardProps {
    letterStates: Record<string, string>;
    onKey: (key: string) => void
}

export function Keyboard({ letterStates, onKey }: KeyboardProps) {
    return (
        <div className="keyboard">
            {ROWS.map((row, i) => (
                <div key={i} className="keyboard__row">
                    {row.map(key => (
                        <button
                            key={key}
                            className={`key ${letterStates[key] ? `key--${letterStates[key]}` : ''} ${key === 'Enter' || key === '⌫' ? 'key--wide' : ''}`}
                            onClick={() => onKey(key === '⌫' ? 'Backspace' : key)}
                        >
                        {key}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    )
}