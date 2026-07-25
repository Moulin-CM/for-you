import { useEffect, useState } from 'react'
import GameGate from './GameGate.jsx'

const CANDLE_XS = [55, 105, 155, 205, 255]

export default function BlowCandlesGame({ onComplete }) {
  const [out, setOut] = useState(() => Array(CANDLE_XS.length).fill(false))
  const allOut = out.every(Boolean)
  const noneOut = out.every((v) => !v)

  useEffect(() => {
    if (allOut) {
      const t = setTimeout(() => onComplete(), 1000)
      return () => clearTimeout(t)
    }
  }, [allOut, onComplete])

  const blowOut = (i) => {
    if (out[i]) return
    setOut((s) => s.map((v, idx) => (idx === i ? true : v)))
    if (navigator.vibrate) navigator.vibrate(12)
  }

  const remaining = out.filter((v) => !v).length

  return (
    <GameGate
      title="Blow out the candles"
      hint="Tap each little flame to blow it out — make a wish while you're at it."
      progress={allOut ? 'all out ✨ wish granted' : `${CANDLE_XS.length - remaining} of ${CANDLE_XS.length}`}
    >
      <div className={`candles-cake${allOut ? ' done' : ''}`}>
        {noneOut && (
          <div className="candles-hint" aria-hidden="true">
            <span className="tap-hint-bubble">tap the flames ✨</span>
          </div>
        )}
        <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cakeTop" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff2f6" />
              <stop offset="1" stopColor="#ffdfe8" />
            </linearGradient>
            <linearGradient id="cakeBase" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#f3d3d9" />
              <stop offset="1" stopColor="#d9a9b3" />
            </linearGradient>
            <radialGradient id="flameGrad" cx="0.5" cy="0.65" r="0.7">
              <stop offset="0"    stopColor="#fff8d0" />
              <stop offset="0.55" stopColor="#ffb454" />
              <stop offset="1"    stopColor="#d76a2e" />
            </radialGradient>
            <radialGradient id="flameGlow" cx="0.5" cy="0.5">
              <stop offset="0" stopColor="#ffce6b" stopOpacity="0.7" />
              <stop offset="1" stopColor="#ffce6b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Plate shadow */}
          <ellipse cx="160" cy="220" rx="140" ry="10" fill="rgba(0,0,0,0.08)" />
          {/* Cake body */}
          <rect x="20" y="150" width="280" height="60" rx="8" fill="url(#cakeBase)" />
          {/* Drips */}
          <path
            d="M20 160 Q40 170, 60 160 T100 160 T140 160 T180 160 T220 160 T260 160 T300 160 V170 H20 Z"
            fill="var(--accent-soft)"
            opacity=".9"
          />
          {/* Top layer */}
          <rect x="20" y="135" width="280" height="30" rx="6" fill="url(#cakeTop)" />

          {CANDLE_XS.map((x, i) => (
            <g key={i}>
              {/* Candle body */}
              <rect x={x - 4} y={100} width="8" height="40" rx="2" fill="#fff" stroke="var(--accent)" strokeWidth="1" />
              <rect x={x - 4} y={112} width="8" height="3" fill="var(--accent)" opacity=".5" />

              {/* Warm glow behind flame */}
              {!out[i] && (
                <circle cx={x} cy={82} r="18" fill="url(#flameGlow)" />
              )}

              {/* Sonar ring — pulses so she sees WHAT to tap */}
              {!out[i] && (
                <>
                  <circle cx={x} cy={82} r="10" fill="none" stroke="var(--accent-deep)" strokeWidth="1.5" opacity=".55">
                    <animate attributeName="r" values="10;24" dur="1.7s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values=".55;0" dur="1.7s" begin={`${i * 0.18}s`} repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Tappable flame group — invisible bigger hit target */}
              <g
                onClick={() => blowOut(i)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), blowOut(i))}
                role="button"
                tabIndex={out[i] ? -1 : 0}
                aria-label={out[i] ? 'flame is out' : `blow out flame ${i + 1}`}
                style={{ cursor: out[i] ? 'default' : 'pointer' }}
              >
                <circle cx={x} cy={82} r="22" fill="transparent" />
                <g className={`flame${out[i] ? ' out' : ''}`} style={{ transformOrigin: `${x}px 96px` }}>
                  {/* Outer flame */}
                  <path
                    d={`M${x} 60 Q${x - 8} 78 ${x} 96 Q${x + 8} 78 ${x} 60 Z`}
                    fill="url(#flameGrad)"
                    stroke="#c85a20" strokeWidth="0.5" strokeOpacity=".3"
                  />
                  {/* Inner flame */}
                  <path
                    d={`M${x} 68 Q${x - 4} 80 ${x} 92 Q${x + 4} 80 ${x} 68 Z`}
                    fill="#fff8d0"
                  />
                  <circle cx={x} cy={88} r="2" fill="#fff" opacity=".95" />
                </g>
              </g>

              {/* Smoke puffs after blow-out */}
              {out[i] && (
                <g opacity=".45">
                  <circle cx={x - 3} cy={78} r="3" fill="#bfb0b8">
                    <animate attributeName="cy" from="78" to="40" dur=".7s" fill="freeze" />
                    <animate attributeName="opacity" from=".7" to="0" dur=".7s" fill="freeze" />
                  </circle>
                  <circle cx={x + 4} cy={72} r="2" fill="#bfb0b8">
                    <animate attributeName="cy" from="72" to="30" dur=".8s" fill="freeze" />
                    <animate attributeName="opacity" from=".6" to="0" dur=".8s" fill="freeze" />
                  </circle>
                  <circle cx={x - 1} cy={82} r="2.5" fill="#d0c1c9">
                    <animate attributeName="cy" from="82" to="46" dur=".9s" fill="freeze" />
                    <animate attributeName="opacity" from=".6" to="0" dur=".9s" fill="freeze" />
                  </circle>
                </g>
              )}
            </g>
          ))}
        </svg>
        {allOut && <div className="game-done-msg">make it a good wish ✨</div>}
      </div>
    </GameGate>
  )
}
