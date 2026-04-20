interface HPBarProps {
  hp: number
  maxHP: number
  label: string
  flip?: boolean
  greyed?: boolean
}

export function HPBar({ hp, maxHP, label, flip = false, greyed }: HPBarProps) {
  const pct = Math.max(0, Math.min(100, (hp / maxHP) * 100))
  const color = pct > 50 ? '#538d4e' : pct > 25 ? '#b59f3b' : '#e74c3c'

  return (
    <div className={`hp-bar ${flip ? 'hp-bar--flip' : ''}`}>
      <span className="hp-bar__label">{label}</span>
      <div className="hp-bar__track">
        <div
          className="hp-bar__fill"
          style={{ width: `${pct}%`, background: greyed ? 'var(--color-border)' : color }}
        />
      </div>
      <span className="hp-bar__value">{Math.max(0, hp)}</span>
    </div>
  )
}