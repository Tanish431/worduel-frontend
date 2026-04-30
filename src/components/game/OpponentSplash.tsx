import { useEffect, useState } from 'react'

interface Props {
  opponentUsername: string
  onDone: () => void
}

export function OpponentSplash({ opponentUsername, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDone()
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="splash">
      <div className="splash__card">
        <p className="splash__label">You are dueling</p>
        <p className="splash__username">{opponentUsername}</p>
        <p className="splash__sub">Good luck!</p>
      </div>
    </div>
  )
}