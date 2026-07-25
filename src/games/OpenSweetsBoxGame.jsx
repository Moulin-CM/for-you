import { useEffect, useState } from 'react'
import GameGate from './GameGate.jsx'

export default function OpenSweetsBoxGame({ onComplete }) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!opening) return
    const t = setTimeout(() => onComplete(), 1100)
    return () => clearTimeout(t)
  }, [opening, onComplete])

  return (
    <GameGate
      title="Open the mithai box"
      hint="Tap the latch — every promise deserves something sweet."
      progress={opening ? 'opening…' : 'a little sweet inside'}
    >
      <div
        className={`sweets-box${opening ? ' opening' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpening(true)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpening(true))}
      >
        <svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="sweetsBody" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#e4b58b" />
              <stop offset="1" stopColor="#b57a4c" />
            </linearGradient>
            <linearGradient id="sweetsLid" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#c98a5a" />
              <stop offset="1" stopColor="#8f5a34" />
            </linearGradient>
          </defs>
          {/* Body */}
          <rect x="20" y="80" width="200" height="90" rx="10" fill="url(#sweetsBody)" />
          {/* Ornate stripe */}
          <rect x="30" y="120" width="180" height="6" fill="var(--accent-deep)" opacity=".7" />
          {/* Sweets peeking inside */}
          <g className="sweets">
            <circle cx="70"  cy="88" r="14" fill="#f8d29a" stroke="#b57a4c" strokeWidth="1.5" />
            <circle cx="120" cy="82" r="16" fill="#f2b5b5" stroke="#a54a58" strokeWidth="1.5" />
            <circle cx="170" cy="90" r="13" fill="#c8dcc2" stroke="#5f8752" strokeWidth="1.5" />
            <circle cx="70"  cy="88" r="4" fill="#b57a4c" />
            <circle cx="120" cy="82" r="4" fill="#a54a58" />
            <circle cx="170" cy="90" r="4" fill="#5f8752" />
          </g>
          {/* Lid */}
          <g className="box-lid">
            <rect x="10" y="60" width="220" height="30" rx="8" fill="url(#sweetsLid)" />
            <rect x="10" y="60" width="220" height="8" fill="var(--accent)" opacity=".7" />
            {/* Latch */}
            <rect x="112" y="55" width="16" height="18" rx="3" fill="var(--accent-deep)" />
            <circle cx="120" cy="64" r="3" fill="#fff8e8" />
          </g>
        </svg>
      </div>
      {opening && <div className="game-done-msg">mithai first, note next ✿</div>}
    </GameGate>
  )
}
