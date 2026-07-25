import { useMemo } from 'react'

export default function Petals({ count = 14 }) {
  const petals = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = Math.round(Math.random() * 100)
      const size = 8 + Math.round(Math.random() * 14)
      const dur = 14 + Math.round(Math.random() * 18)
      const delay = -Math.round(Math.random() * dur)
      const opacity = 0.35 + Math.random() * 0.4
      return { i, left, size, dur, delay, opacity }
    })
  }, [count])

  return (
    <div className="petals" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.i}
          className="petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
