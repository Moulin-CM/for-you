import { useEffect, useMemo, useRef, useState } from 'react'
import Envelope from '../components/Envelope.jsx'
import Petals from '../components/Petals.jsx'
import { decodePayload } from '../utils/payload.js'
import { getOccasion } from '../theme/occasions.js'
import { renderRichText } from '../utils/inline.jsx'
import { getGame } from '../games/index.js'
import { fetchRawGift } from '../utils/github.js'

// Accept an encoded `data` string (URL fragment), a `slug` (fetch /gifts/<slug>.json),
// or a `payload` object (used by the Admin preview panel).
export default function Gift({ data, slug, payload: payloadProp, embedded = false }) {
  const inlinePayload = useMemo(() => {
    if (payloadProp) return payloadProp
    if (data) return decodePayload(data)
    return null
  }, [data, payloadProp])

  const [fetched, setFetched] = useState(null)
  const [loadState, setLoadState] = useState(slug ? 'loading' : 'idle')
  // 'idle' | 'loading' | 'ready' | 'missing'
  useEffect(() => {
    if (!slug) { setLoadState('idle'); return }
    let cancelled = false
    setFetched(null); setLoadState('loading')

    const set = (json) => {
      if (cancelled) return
      setFetched(json); setLoadState('ready')
    }
    const missing = () => { if (!cancelled) setLoadState('missing') }

    ;(async () => {
      // 1. Try the deployed Pages copy first (edge-cached, instant).
      try {
        const r = await fetch(`./gifts/${slug}.json`, { cache: 'no-cache' })
        if (r.ok) return set(await r.json())
      } catch { /* network or cors, fall through */ }

      // 2. Try the raw file on main branch — available seconds after publish,
      //    even before the next Pages redeploy.
      try {
        const json = await fetchRawGift(slug)
        return set(json)
      } catch { /* not published yet */ }

      // 3. Fall back to a local draft saved from the Studio in this browser.
      try {
        const cached = localStorage.getItem(`gift:${slug}`)
        if (cached) return set(JSON.parse(cached))
      } catch { /* localStorage unavailable */ }

      missing()
    })()

    return () => { cancelled = true }
  }, [slug])

  const payload = inlinePayload || fetched
  const [opened, setOpened] = useState(embedded)

  useEffect(() => {
    // Reset when a fresh preview payload comes in (admin editing).
    if (embedded) setOpened(true)
  }, [embedded, payload])

  if (!payload) {
    if (loadState === 'loading') {
      return <div className="landing"><div className="card"><p>Opening…</p></div></div>
    }
    if (loadState === 'missing') {
      return (
        <div className="landing">
          <div className="card">
            <h1>Not published yet</h1>
            <p>
              No gift file for <code style={{ padding: '2px 6px', background: 'var(--sand)', borderRadius: 4 }}>{slug}</code> exists yet.
            </p>
            <p style={{ fontSize: 14, marginTop: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              Open the Studio, fill it in, and hit <b>Publish</b>. The link will work within a minute.
            </p>
            <div className="row" style={{ marginTop: 18 }}>
              <a className="btn" href="#/admin">Open the Studio</a>
              <a className="btn ghost" href="#/">Back home</a>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="landing">
        <div className="card">
          <h1>Nothing here yet</h1>
          <p>This link looks empty or was mistyped. If someone sent you this, ask them to resend the full link.</p>
          <div className="row" style={{ marginTop: 16 }}>
            <a className="btn ghost" href="#/">Back home</a>
          </div>
        </div>
      </div>
    )
  }

  const occ = getOccasion(payload.occasion)

  return (
    <div className={occ.themeClass} style={{ minHeight: '100svh', position: 'relative' }}>
      {!embedded && <Petals />}
      {!embedded && !opened && (
        <Envelope toName={payload.to} onOpen={() => setOpened(true)} />
      )}
      {opened && (
        <>
          {!embedded && (
            <button
              className="close-envelope"
              onClick={() => setOpened(false)}
              aria-label="Close and put the envelope back"
              title="Put it back"
            >
              ← put it back
            </button>
          )}
          <GiftContent payload={payload} occ={occ} embedded={embedded} />
        </>
      )}
    </div>
  )
}

function GiftContent({ payload, occ, embedded = false }) {
  const ref = useRef(null)
  const galleryRef = useRef(null)
  const messageRef = useRef(null)
  const wishesRef = useRef(null)

  const photos = (payload.photos || []).filter((p) => p && p.src)
  const surprises = (payload.surprises || []).filter((s) => s && s.trim())
  const heroTitle = occ.heroTitle(payload.to)
  const signoff = payload.signoff || occ.defaultSignoff

  // Games are on by default. Skipped in embedded (admin preview) mode.
  const gamesOn = (payload.includeGames ?? true) && !embedded
  const AlbumGame = gamesOn && occ.games?.album ? getGame(occ.games.album) : null
  const MessageGame = gamesOn && occ.games?.message ? getGame(occ.games.message) : null

  // A gate is only "active" if the section it protects exists.
  const albumNeedsGame = !!AlbumGame && photos.length > 0
  const messageNeedsGame = !!MessageGame && !!payload.message

  const [albumUnlocked, setAlbumUnlocked] = useState(!albumNeedsGame)
  const [messageUnlocked, setMessageUnlocked] = useState(!messageNeedsGame)
  useEffect(() => { setAlbumUnlocked(!albumNeedsGame) }, [albumNeedsGame])
  useEffect(() => { setMessageUnlocked(!messageNeedsGame) }, [messageNeedsGame])

  const scrollTo = (node) => {
    if (!node || embedded) return
    setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
  }

  const unlockAlbum   = () => { setAlbumUnlocked(true);   scrollTo(galleryRef.current) }
  const unlockMessage = () => { setMessageUnlocked(true); scrollTo(messageRef.current) }

  // Re-run whenever sections get unlocked so post-mount .reveal elements
  // are actually observed (otherwise they stay at opacity 0 forever).
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08 },
    )
    ref.current.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [payload, albumUnlocked, messageUnlocked])

  return (
    <div className="gift-shell" ref={ref}>
      <section className="hero-block reveal">
        <div className="kicker">{occ.kicker}</div>
        <h1>{heroTitle}</h1>
        <p className="lede">{payload.lede || occ.lede}</p>
      </section>

      {photos.length > 0 && (
        <>
          <div className="divider reveal">
            <span>{occ.galleryHeading}</span>
          </div>
          {!albumUnlocked && AlbumGame && (
            <AlbumGame photos={photos} onComplete={unlockAlbum} />
          )}
          {albumUnlocked && (
            <section className="gallery" ref={galleryRef}>
              {photos.map((p, i) => (
                <figure key={i} className="photo-card reveal">
                  <div className="index">{String(i + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</div>
                  <div className="frame">
                    <img src={p.src} alt={p.caption || ''} loading="lazy" />
                  </div>
                  <figcaption className="cap">{p.caption || ''}</figcaption>
                </figure>
              ))}
            </section>
          )}
        </>
      )}

      {/* Message section stays hidden until the album is unlocked. */}
      {payload.message && albumUnlocked && (
        <>
          <div className="divider reveal"><span>a note</span></div>
          {!messageUnlocked && MessageGame && (
            <MessageGame photos={photos} onComplete={unlockMessage} />
          )}
          {messageUnlocked && (
            <section className="message-card reveal" ref={messageRef}>
              {renderRichText(payload.message)}
              {payload.from && (
                <div className="signature">
                  {signoff}<br />
                  {payload.from}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Wishes only after the note has been revealed. */}
      {surprises.length > 0 && messageUnlocked && (
        <>
          <div className="divider reveal"><span>{occ.surprisesHeading}</span></div>
          <section className="surprises" ref={wishesRef}>
            {surprises.map((s, i) => (
              <div key={i} className="surprise-tile reveal">
                <div className="n">{i + 1}</div>
                <p>{s}</p>
              </div>
            ))}
          </section>
        </>
      )}

      {messageUnlocked && (
        <div className="footnote reveal">
          made with warmth · just for you
        </div>
      )}
    </div>
  )
}
