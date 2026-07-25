import { useEffect, useRef, useState } from 'react'
import GameGate from './GameGate.jsx'

const TARGET = 3
const SPAWN_MS = 900          // new star arrives roughly this often
const FALL_MIN = 4.5          // seconds
const FALL_MAX = 6.5

function makeStar(stageW) {
  return {
    id: `s-${Math.random().toString(36).slice(2, 10)}`,
    left: 20 + Math.random() * Math.max(1, stageW - 60),
    duration: FALL_MIN + Math.random() * (FALL_MAX - FALL_MIN),
    caught: false,
  }
}

export default function CatchStarsGame({ onComplete }) {
  const stageRef = useRef(null)
  const [stageW, setStageW] = useState(320)
  const [stars, setStars] = useState([])
  const [count, setCount] = useState(0)
  const doneRef = useRef(false)

  // Measure the stage width so stars stay in bounds on tiny screens.
  useEffect(() => {
    const measure = () => stageRef.current && setStageW(stageRef.current.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    if (stageRef.current) ro.observe(stageRef.current)
    return () => ro.disconnect()
  }, [])

  // Spawn a star: right away on catch, and on a steady cadence.
  useEffect(() => {
    if (doneRef.current) return
    if (count >= TARGET) {
      doneRef.current = true
      const t = setTimeout(() => onComplete(), 700)
      return () => clearTimeout(t)
    }
    let cancelled = false
    const spawn = () => {
      if (cancelled || doneRef.current) return
      const s = makeStar(stageW)
      setStars((cur) => [...cur, s])
      setTimeout(() => {
        setStars((cur) => cur.filter((x) => x.id !== s.id))
      }, s.duration * 1000)
    }
    spawn()                                   // one immediately
    const interval = setInterval(spawn, SPAWN_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [count, stageW, onComplete])

  const catchStar = (id) => {
    setStars((cur) => cur.map((s) => (s.id === id ? { ...s, caught: true } : s)))
    setCount((c) => Math.min(TARGET, c + 1))
    setTimeout(() => setStars((cur) => cur.filter((s) => s.id !== id)), 450)
  }

  const caughtAll = count >= TARGET

  return (
    <GameGate
      title="Catch three little stars"
      hint="Tap the stars as they float down. Take your time — more keep coming."
      progress={caughtAll ? 'a whole handful ✨' : `${count} of ${TARGET}`}
    >
      <div className="stars-stage" ref={stageRef}>
        <div className="catch-count">{count} / {TARGET}</div>
        {stars.map((s) => (
          <svg
            key={s.id}
            className={`star${s.caught ? ' caught' : ''}`}
            viewBox="0 0 24 24"
            style={{
              left: s.left,
              animationDuration: `${s.duration}s`,
            }}
            onClick={() => !s.caught && catchStar(s.id)}
          >
            <path
              d="M12 2 L14.5 9 L22 9.5 L16 14 L18 22 L12 17.5 L6 22 L8 14 L2 9.5 L9.5 9 Z"
              fill="currentColor"
              stroke="#fff"
              strokeWidth="1"
            />
          </svg>
        ))}
      </div>
    </GameGate>
  )
}
