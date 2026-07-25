import { useEffect, useState } from 'react'
import GameGate from './GameGate.jsx'

export default function UnwrapGiftGame({ onComplete }) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!opening) return
    const t = setTimeout(() => onComplete(), 1100)
    return () => clearTimeout(t)
  }, [opening, onComplete])

  return (
    <GameGate
      title="Open your gift"
      hint="Tap the box to untie the bow."
      progress={opening ? 'opening…' : 'a little something inside'}
    >
      <div
        className={`giftbox${opening ? ' opening' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setOpening(true)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpening(true))}
      >
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="boxBody" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent-soft)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
            <linearGradient id="boxLid" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-deep)" />
            </linearGradient>
          </defs>
          {/* Body */}
          <rect x="30" y="80" width="140" height="100" rx="6" fill="url(#boxBody)" />
          {/* Vertical ribbon on body */}
          <rect className="ribbon-v" x="90" y="80" width="20" height="100" fill="var(--accent-deep)" />
          {/* Lid */}
          <g className="lid">
            <rect x="20" y="60" width="160" height="30" rx="6" fill="url(#boxLid)" />
            <rect className="ribbon-h" x="20" y="72" width="160" height="8" fill="var(--accent-soft)" opacity=".9" />
            {/* Bow */}
            <g className="bow" transform="translate(100 60)">
              <ellipse cx="-14" cy="0" rx="14" ry="10" fill="var(--accent-deep)" />
              <ellipse cx="14" cy="0" rx="14" ry="10" fill="var(--accent-deep)" />
              <circle cx="0" cy="0" r="6" fill="var(--accent)" stroke="#fff" strokeWidth="1" />
            </g>
          </g>
          {/* Peek — a small letter */}
          {opening && (
            <g>
              <rect x="70" y="70" width="60" height="40" rx="3" fill="#fffdf9" stroke="var(--accent-deep)" strokeWidth="1">
                <animate attributeName="y" from="90" to="55" dur=".8s" fill="freeze" />
              </rect>
              <text x="100" y="93" textAnchor="middle" fontFamily="Caveat, cursive" fontSize="16" fill="var(--accent-deep)">
                for you
                <animate attributeName="y" from="113" to="78" dur=".8s" fill="freeze" />
              </text>
            </g>
          )}
        </svg>
        <div className="shine" aria-hidden="true" />
      </div>
      {opening && <div className="game-done-msg">for your eyes only ✿</div>}
    </GameGate>
  )
}
