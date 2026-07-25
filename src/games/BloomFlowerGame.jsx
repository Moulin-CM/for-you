import { useEffect, useMemo, useState } from 'react'
import GameGate from './GameGate.jsx'

const PETALS = 6

export default function BloomFlowerGame({ onComplete }) {
  const [taps, setTaps] = useState(0)
  const [ripples, setRipples] = useState([])
  const bloomed = taps >= PETALS

  const sparkles = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: 6 + Math.random() * 88,
      top: 6 + Math.random() * 88,
      size: 3 + Math.random() * 6,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
    })),
    [],
  )

  useEffect(() => {
    if (bloomed) {
      const t = setTimeout(() => onComplete(), 1700)
      return () => clearTimeout(t)
    }
  }, [bloomed, onComplete])

  const tap = () => {
    if (bloomed) return
    setTaps((n) => Math.min(PETALS, n + 1))
    const id = Date.now() + Math.random()
    setRipples((r) => [...r, id])
    setTimeout(() => setRipples((r) => r.filter((x) => x !== id)), 900)
    if (navigator.vibrate) navigator.vibrate(12)
  }

  return (
    <GameGate
      title="Help the flower bloom"
      hint="Tap the glowing bud — every tap opens a new petal."
      progress={bloomed ? 'fully bloomed ✿' : `${taps} of ${PETALS} petals`}
    >
      <div className={`bloom-stage${bloomed ? ' bloomed' : ''}`}>
        <div className="bloom-glow" aria-hidden="true" />
        <div className="bloom-particles" aria-hidden="true">
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="sparkle-dot"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>

        {taps === 0 && (
          <div className="tap-hint" aria-hidden="true">
            <span className="tap-hint-bubble">tap me ✨</span>
          </div>
        )}

        <svg className="flower-svg" viewBox="0 0 300 300">
          <defs>
            <radialGradient id="petalGrad" cx="0.5" cy="0.3" r="0.9">
              <stop offset="0"   stopColor="#fff8e6" />
              <stop offset="0.55" stopColor="var(--accent-soft)" />
              <stop offset="1"   stopColor="var(--accent)" />
            </radialGradient>
            <radialGradient id="petalStreak" cx="0.5" cy="0.5">
              <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="budGrad" cx="0.35" cy="0.35">
              <stop offset="0"   stopColor="#fff2ad" />
              <stop offset="0.65" stopColor="#f0b93a" />
              <stop offset="1"   stopColor="#a86214" />
            </radialGradient>
            <linearGradient id="stemGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7fb865" />
              <stop offset="1" stopColor="#4a7a3a" />
            </linearGradient>
          </defs>

          {/* Grass tuft */}
          <path d="M40 268 Q90 258 150 264 Q210 258 260 268 L260 275 L40 275 Z" fill="#a8c990" opacity=".55" />
          {[68, 88, 110, 195, 220, 240].map((x, i) => (
            <path
              key={i}
              d={`M${x} 264 Q${x + 2} 248 ${x + 4} 264`}
              stroke="#6fa055"
              strokeWidth="1.6"
              fill="none"
              opacity=".7"
            />
          ))}

          {/* Stem with gentle sway */}
          <g className="stem-sway">
            <path
              d="M150 264 Q156 224 150 184 Q144 164 150 144"
              stroke="url(#stemGrad)"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M150 220 Q118 208 104 190 Q134 204 150 220 Z" fill="#8cbf74" />
            <path d="M150 200 Q182 194 198 178 Q170 200 150 200 Z" fill="#8cbf74" />
          </g>

          {/* Flower group — coordinate origin is the flower center */}
          <g transform="translate(150 140)">
            {/* Layered petals: scale from center */}
            {Array.from({ length: PETALS }).map((_, i) => {
              const angle = (360 / PETALS) * i - 90
              const open = i < taps
              return (
                <g
                  key={i}
                  style={{
                    transformOrigin: '0 0',
                    transformBox: 'view-box',
                    transform: `rotate(${angle}deg) scale(${open ? 1 : 0})`,
                    transition: 'transform .7s cubic-bezier(.34, 1.56, .64, 1)',
                  }}
                >
                  <ellipse
                    cx="0" cy="-42" rx="19" ry="34"
                    fill="url(#petalGrad)"
                    stroke="var(--accent-deep)" strokeWidth="1" strokeOpacity=".22"
                  />
                  <ellipse cx="0" cy="-38" rx="7" ry="18" fill="url(#petalStreak)" />
                </g>
              )
            })}

            {/* Sonar tap-rings around the bud — only before bloom */}
            {!bloomed && (
              <>
                <circle cx="0" cy="0" r="22" fill="none" stroke="var(--accent-deep)" strokeWidth="2" opacity=".65">
                  <animate attributeName="r" values="22;48" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values=".65;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="22" fill="none" stroke="var(--accent-deep)" strokeWidth="2" opacity=".45">
                  <animate attributeName="r" values="22;48" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values=".45;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Per-tap ripple */}
            {ripples.map((id) => (
              <circle key={id} cx="0" cy="0" r="18" fill="none" stroke="var(--accent-deep)" strokeWidth="2.5">
                <animate attributeName="r" from="18" to="70" dur=".8s" fill="freeze" />
                <animate attributeName="opacity" from=".85" to="0" dur=".8s" fill="freeze" />
              </circle>
            ))}

            {/* Bud — the tappable center */}
            <g
              onClick={tap}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tap())}
              role="button"
              tabIndex={0}
              aria-label={bloomed ? 'Flower is fully bloomed' : `Tap the bud (${taps} of ${PETALS} petals opened)`}
              style={{ cursor: bloomed ? 'default' : 'pointer' }}
              className={`bloom-bud${bloomed ? '' : ' pulsing'}`}
            >
              {/* invisible larger hit area for easy tapping */}
              <circle cx="0" cy="0" r="38" fill="transparent" />
              <circle
                cx="0" cy="0"
                r={bloomed ? 26 : 18}
                fill="url(#budGrad)"
                stroke="var(--accent-deep)" strokeWidth="1.5"
                style={{
                  transition: 'r .5s cubic-bezier(.34, 1.56, .64, 1), filter .5s',
                  filter: bloomed
                    ? 'drop-shadow(0 0 18px rgba(240, 185, 58, 0.95)) drop-shadow(0 0 8px rgba(255, 235, 130, 0.7))'
                    : `drop-shadow(0 0 ${4 + taps * 2}px rgba(240, 185, 58, ${0.35 + taps * 0.1}))`,
                }}
              />
              {/* Highlights on the bud so it reads as a 3D orb */}
              <circle cx="-5" cy="-5" r="3" fill="#fff" opacity=".8" />
              <circle cx="5" cy="4" r="1.5" fill="#fff" opacity=".55" />
              {bloomed && (
                <>
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#fff" strokeWidth="1" opacity=".8">
                    <animate attributeName="r" from="0" to="28" dur=".9s" fill="freeze" />
                    <animate attributeName="opacity" from=".9" to="0" dur=".9s" fill="freeze" />
                  </circle>
                </>
              )}
            </g>

            {/* Sparkle burst when fully bloomed */}
            {bloomed && (
              <g>
                {[
                  [-70, -60], [70, -65], [90, 10], [-95, 25],
                  [-40, -95], [45, -95], [-85, 80], [80, 80],
                ].map(([x, y], i) => (
                  <g
                    key={i}
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: `bloom-spark 1.4s ${i * 0.08}s ease-out forwards`,
                      opacity: 0,
                    }}
                  >
                    <path
                      d={`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`}
                      fill="var(--accent)"
                    />
                  </g>
                ))}
              </g>
            )}
          </g>
        </svg>

        {bloomed && <div className="game-done-msg">look at that — fully bloomed ✿</div>}
      </div>
    </GameGate>
  )
}
