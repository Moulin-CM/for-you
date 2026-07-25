export default function GameGate({ title, hint, progress, children }) {
  return (
    <section className="game-gate reveal">
      <header className="game-head">
        <div>
          <div className="game-title">{title}</div>
          {progress != null && <div className="game-progress">{progress}</div>}
        </div>
      </header>
      {hint && <p className="game-hint">{hint}</p>}
      <div className="game-stage">{children}</div>
    </section>
  )
}
