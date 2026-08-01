import { useEffect, useState } from 'react'

// A wrapped mystery gift. Recipient doesn't know what's inside until they tap.
// Plays a lid-lift + bow-fly + confetti-burst animation, then calls onOpen()
// so the parent can swap in the revealed content.
export default function SurpriseGift({
  label = 'A little something for you',
  hint = 'Tap to unwrap',
  onOpen,
}) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    if (!opening) return
    const t = setTimeout(() => onOpen?.(), 1200)
    return () => clearTimeout(t)
  }, [opening, onOpen])

  const activate = () => { if (!opening) setOpening(true) }

  return (
    <section className="surprise-gift-wrap reveal">
      <div className="sg-label">{label}</div>
      <div
        className={`surprise-gift${opening ? ' opening' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open the surprise"
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() }
        }}
      >
        <div className="sg-sparkles" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className={`sg-sp sg-sp-${i}`} />
          ))}
        </div>

        <svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" className="sg-svg">
          <defs>
            <linearGradient id="sgBody" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent-soft)" />
              <stop offset="1" stopColor="var(--accent)" />
            </linearGradient>
            <linearGradient id="sgLid" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--accent-deep)" />
            </linearGradient>
          </defs>

          {/* Body */}
          <g className="sg-body-g">
            <rect x="34" y="112" width="172" height="128" rx="10" fill="url(#sgBody)" />
            <rect x="34" y="112" width="172" height="128" rx="10" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <rect className="sg-ribbon-v" x="108" y="112" width="24" height="128" fill="var(--accent-deep)" />
          </g>

          {/* Lid */}
          <g className="sg-lid-g">
            <rect x="24" y="86" width="192" height="38" rx="8" fill="url(#sgLid)" />
            <rect x="24" y="86" width="192" height="38" rx="8" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <rect className="sg-ribbon-h" x="24" y="100" width="192" height="10" fill="var(--accent-soft)" opacity=".9" />
          </g>

          {/* Bow — has its own anchor for the fly-off animation */}
          <g className="sg-bow-anchor">
            <g className="sg-bow-g">
              <ellipse cx="102" cy="80" rx="22" ry="16" fill="var(--accent-deep)" />
              <ellipse cx="138" cy="80" rx="22" ry="16" fill="var(--accent-deep)" />
              <ellipse cx="102" cy="80" rx="10" ry="8" fill="var(--accent)" opacity=".55" />
              <ellipse cx="138" cy="80" rx="10" ry="8" fill="var(--accent)" opacity=".55" />
              <path d="M 112 92 L 100 116" stroke="var(--accent-deep)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M 128 92 L 140 116" stroke="var(--accent-deep)" strokeWidth="5" strokeLinecap="round" fill="none" />
              <circle cx="120" cy="80" r="10" fill="var(--accent)" stroke="#fffdf9" strokeWidth="2" />
            </g>
          </g>

          {/* Confetti burst — animates outward on open */}
          <g className="sg-confetti" aria-hidden="true">
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2
              const dx = Math.cos(angle) * 110
              const dy = Math.sin(angle) * 110 - 20
              const shapes = ['circle', 'rect', 'circle']
              const shape = shapes[i % shapes.length]
              const colors = ['var(--accent-deep)', 'var(--accent)', 'var(--accent-soft)', '#fffdf9']
              const fill = colors[i % colors.length]
              const style = {
                '--tx': `${dx}px`,
                '--ty': `${dy}px`,
                '--rot': `${(i * 47) % 360}deg`,
                animationDelay: `${i * 24}ms`,
              }
              return shape === 'circle' ? (
                <circle key={i} cx="120" cy="130" r="4" fill={fill} style={style} />
              ) : (
                <rect key={i} x="116" y="126" width="8" height="4" rx="1" fill={fill} style={style} />
              )
            })}
          </g>
        </svg>
      </div>
      <div className="sg-hint">{opening ? 'opening…' : hint}</div>
    </section>
  )
}
