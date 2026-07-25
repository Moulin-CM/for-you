import { useEffect, useState } from 'react'

export default function Envelope({ toName, onOpen }) {
  const [opening, setOpening] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!opening) return
    const t = setTimeout(() => {
      setGone(true)
      onOpen?.()
    }, 1400)
    return () => clearTimeout(t)
  }, [opening, onOpen])

  const handleActivate = () => {
    if (!opening) setOpening(true)
  }

  return (
    <div className={`envelope-stage${gone ? ' gone' : ''}`} aria-hidden={gone}>
      <div>
        <div
          className={`envelope${opening ? ' open' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Open the envelope for ${toName || 'you'}`}
          onClick={handleActivate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleActivate()
            }
          }}
        >
          <div className="flap" />
          <div className="seal" aria-hidden="true">M</div>
          <div className="letter">
            <div className="to-line">
              <small>For</small>
              {toName || 'you'}
            </div>
          </div>
        </div>
        <div className="envelope-hint">Tap to open · take your time</div>
      </div>
    </div>
  )
}
