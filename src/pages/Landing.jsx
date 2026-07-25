export default function Landing() {
  return (
    <div className="landing">
      <div className="card">
        <div style={{ fontFamily: 'var(--script)', fontSize: 28, color: 'var(--accent-deep)' }}>
          A little something for someone special
        </div>
        <h1 style={{ marginTop: 8 }}>Make a surprise page</h1>
        <p>
          Choose a person, pick the occasion, add a few photos and a heartfelt note.
          You'll get a private link you can share whenever you're ready.
        </p>
        <div className="row">
          <a className="btn" href="#/admin">Open the studio</a>
          <a className="btn ghost" href="https://github.com/features/pages" target="_blank" rel="noreferrer">
            About the setup
          </a>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          Nothing is uploaded to any server. Everything lives inside the link you generate.
        </p>
      </div>
    </div>
  )
}
