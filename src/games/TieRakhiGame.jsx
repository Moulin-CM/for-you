import { useEffect, useRef, useState } from 'react'
import GameGate from './GameGate.jsx'

// Drag the two thread ends toward the center of the wrist to "tie" the rakhi.
// Fully forgiving — any drag past the halfway mark counts.

export default function TieRakhiGame({ onComplete }) {
  const stageRef = useRef(null)
  const [leftX, setLeftX] = useState(60)
  const [rightX, setRightX] = useState(300)
  const [dragging, setDragging] = useState(null) // 'left' | 'right' | null
  const [everMoved, setEverMoved] = useState(false)
  const tied = leftX >= 150 && rightX <= 210
  const showHint = !everMoved && !tied

  useEffect(() => {
    if (tied) {
      if (navigator.vibrate) navigator.vibrate([15, 40, 15])
      const t = setTimeout(() => onComplete(), 1000)
      return () => clearTimeout(t)
    }
  }, [tied, onComplete])

  const onPointerDown = (which) => (e) => {
    e.preventDefault()
    setDragging(which)
    stageRef.current?.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * 360
    if (dragging === 'left') setLeftX(Math.max(60, Math.min(180, relX)))
    else setRightX(Math.max(180, Math.min(300, relX)))
    if (!everMoved) setEverMoved(true)
  }
  const onPointerUp = () => setDragging(null)

  return (
    <GameGate
      title="Tie the rakhi"
      hint="Drag both ribbon ends toward the wrist. Just a gentle swipe."
      progress={tied ? 'tied with love 💛' : 'drag both ends inward'}
    >
      <div
        className={`rakhi-stage${tied ? ' tied' : ''}`}
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {showHint && (
          <div className="rakhi-hint" aria-hidden="true">
            <span className="tap-hint-bubble">← drag both ends inward →</span>
          </div>
        )}

        <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wristGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f7e0c4" />
              <stop offset="1" stopColor="#e0b98a" />
            </linearGradient>
            <radialGradient id="beadGrad" cx="0.35" cy="0.35">
              <stop offset="0" stopColor="#ffe4dc" />
              <stop offset="0.6" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-deep)" />
            </radialGradient>
          </defs>

          {/* Wrist */}
          <rect x="40" y="130" width="280" height="70" rx="35" fill="url(#wristGrad)" stroke="#c99566" strokeWidth="2" />
          <line x1="72" y1="142" x2="90" y2="152" stroke="#c99566" strokeWidth="1" opacity=".55" />
          <line x1="270" y1="142" x2="288" y2="152" stroke="#c99566" strokeWidth="1" opacity=".55" />
          <line x1="80" y1="170" x2="98" y2="180" stroke="#c99566" strokeWidth="1" opacity=".35" />
          <line x1="262" y1="170" x2="280" y2="180" stroke="#c99566" strokeWidth="1" opacity=".35" />

          {/* Ribbon — anchored at wrist edges, meets the draggable ends */}
          <path
            d={`M60 165 Q${(60 + leftX) / 2} 145 ${leftX} 165`}
            stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round"
          />
          <path
            d={`M300 165 Q${(300 + rightX) / 2} 145 ${rightX} 165`}
            stroke="var(--accent)" strokeWidth="5" fill="none" strokeLinecap="round"
          />

          {/* Center rakhi flower — scales in when tied */}
          <g className="rakhi-flower" style={{ transformOrigin: '180px 165px' }}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <ellipse
                key={deg}
                cx="180" cy="145" rx="8" ry="15"
                fill="var(--accent)"
                stroke="var(--accent-deep)" strokeWidth="1" strokeOpacity=".3"
                transform={`rotate(${deg} 180 165)`}
              />
            ))}
            <circle cx="180" cy="165" r="14" fill="url(#beadGrad)" stroke="var(--accent-deep)" strokeWidth="1.5" />
            <circle cx="180" cy="165" r="5" fill="#fff8e8" />
          </g>

          {/* Sonar rings around each end — while ungrabbed and not yet dragged */}
          {!tied && dragging !== 'left' && (
            <circle cx={leftX} cy="165" r="12" fill="none" stroke="var(--accent-deep)" strokeWidth="1.5" opacity=".55">
              <animate attributeName="r" values="12;26" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".55;0" dur="1.6s" repeatCount="indefinite" />
            </circle>
          )}
          {!tied && dragging !== 'right' && (
            <circle cx={rightX} cy="165" r="12" fill="none" stroke="var(--accent-deep)" strokeWidth="1.5" opacity=".55">
              <animate attributeName="r" values="12;26" dur="1.6s" begin=".8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".55;0" dur="1.6s" begin=".8s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Draggable ends — outer <g> positions (SVG transform),
              inner <g> handles the CSS scale pulse. Keeping them on the
              same <g> makes CSS clobber the translate. */}
          <g transform={`translate(${leftX} 165)`}>
            <g
              className={`thread-end${dragging === 'left' ? ' grabbed' : ''}`}
              onPointerDown={onPointerDown('left')}
              role="button"
              tabIndex={0}
              aria-label="Drag the left ribbon end inward"
            >
              <circle r="22" fill="transparent" />
              <circle r="11" fill="url(#beadGrad)" stroke="#fff" strokeWidth="2"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(90,45,60,0.25))' }}
              />
              <circle r="4" cx="-3" cy="-3" fill="#fff" opacity=".7" />
            </g>
          </g>
          <g transform={`translate(${rightX} 165)`}>
            <g
              className={`thread-end${dragging === 'right' ? ' grabbed' : ''}`}
              onPointerDown={onPointerDown('right')}
              role="button"
              tabIndex={0}
              aria-label="Drag the right ribbon end inward"
            >
              <circle r="22" fill="transparent" />
              <circle r="11" fill="url(#beadGrad)" stroke="#fff" strokeWidth="2"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(90,45,60,0.25))' }}
              />
              <circle r="4" cx="-3" cy="-3" fill="#fff" opacity=".7" />
            </g>
          </g>

          {/* Sparkle burst when tied */}
          {tied && (
            <g>
              {[
                [140, 120], [220, 120], [130, 190], [230, 190],
                [180, 100], [180, 210],
              ].map(([x, y], i) => (
                <g
                  key={i}
                  style={{
                    transformOrigin: `${x}px ${y}px`,
                    animation: `bloom-spark 1.2s ${i * 0.09}s ease-out forwards`,
                    opacity: 0,
                  }}
                >
                  <path
                    d={`M${x} ${y - 6} L${x + 2} ${y} L${x + 6} ${y} L${x + 2} ${y + 2} L${x + 3} ${y + 6} L${x} ${y + 3} L${x - 3} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y} Z`}
                    fill="var(--accent)"
                  />
                </g>
              ))}
            </g>
          )}
        </svg>
        {tied && <div className="game-done-msg">tied with love 💛</div>}
      </div>
    </GameGate>
  )
}
