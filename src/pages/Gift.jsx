import { useEffect, useMemo, useRef, useState } from 'react'
import Envelope from '../components/Envelope.jsx'
import Petals from '../components/Petals.jsx'
import SurpriseGift from '../components/SurpriseGift.jsx'
import { decodePayload } from '../utils/payload.js'
import { getOccasion, getRecipient } from '../theme/occasions.js'
import { renderRichText } from '../utils/inline.jsx'
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
      // 1. Prefer a local Studio draft when present — the admin sees their
      //    latest edits instantly without needing to republish. Real recipients
      //    on a different browser won't have this, so they fall through to (2)/(3).
      try {
        const cached = localStorage.getItem(`gift:${slug}`)
        if (cached) return set(JSON.parse(cached))
      } catch { /* localStorage unavailable */ }

      // 2. Try the deployed Pages copy (edge-cached, instant).
      try {
        const r = await fetch(`./gifts/${slug}.json`, { cache: 'no-cache' })
        if (r.ok) return set(await r.json())
      } catch { /* network or cors, fall through */ }

      // 3. Try the raw file on main branch — available seconds after publish,
      //    even before the next Pages redeploy.
      try {
        const json = await fetchRawGift(slug)
        return set(json)
      } catch { /* not published yet */ }

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
  const songs = (payload.songs || []).filter((s) => s && (s.title || '').trim())
  const heroTitle = occ.heroTitle(payload.to)
  const signoff = payload.signoff || occ.defaultSignoff
  const recipientLabel = getRecipient(payload.recipient).label

  const [nameBurst, setNameBurst] = useState(false)
  const [oneMoreOpen, setOneMoreOpen] = useState(false)
  const [noteOpened, setNoteOpened] = useState(false)
  const [certRevealed, setCertRevealed] = useState(false)

  // Surprise-gift gating is on by default. Skipped in embedded (admin preview) mode.
  const useSurpriseReveal = (payload.includeGames ?? true) && !embedded
  const albumNeedsGift   = useSurpriseReveal && photos.length > 0
  const messageNeedsGift = useSurpriseReveal && !!payload.message

  const [albumUnlocked, setAlbumUnlocked] = useState(!albumNeedsGift)
  const [messageUnlocked, setMessageUnlocked] = useState(!messageNeedsGift)
  useEffect(() => { setAlbumUnlocked(!albumNeedsGift) }, [albumNeedsGift])
  useEffect(() => { setMessageUnlocked(!messageNeedsGift) }, [messageNeedsGift])

  // If there's no folded note, downstream reveals shouldn't wait for one.
  const certGateReady = messageUnlocked && (!payload.extraNote || noteOpened)
  // "One more?" waits for the certificate to be revealed (or messageUnlocked if no certificate).
  const oneMoreReady = payload.certificate ? certRevealed : certGateReady

  const scrollTo = (node) => {
    if (!node || embedded) return
    setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
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
  }, [payload, albumUnlocked, messageUnlocked, noteOpened, certRevealed])

  // Fire the "hi, [name] ✿" petals burst once when wishes enter the viewport.
  useEffect(() => {
    if (!wishesRef.current || embedded || nameBurst || !payload.to) return
    const el = wishesRef.current
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNameBurst(true)
          io.disconnect()
          setTimeout(() => setNameBurst(false), 4200)
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [messageUnlocked, embedded, nameBurst, payload.to, surprises.length])

  return (
    <div className="gift-shell" ref={ref}>
      <section className="hero-block reveal">
        <div className="kicker">{occ.kicker}</div>
        <h1>{heroTitle}</h1>
        <p className="lede">{payload.lede || occ.lede}</p>
      </section>

      {photos.length > 0 && (
        <>
          {!albumUnlocked && (
            <SurpriseGift
              label="A little surprise, just for you"
              hint="Tap to unwrap ✿ (only you know what's inside)"
              onOpen={unlockAlbum}
            />
          )}
          {albumUnlocked && (
            <>
              <div className="divider reveal">
                <span>{occ.galleryHeading}</span>
              </div>
              <section className="gallery" ref={galleryRef}>
                {photos.map((p, i) => (
                  <figure
                    key={i}
                    className="photo-card photo-drop"
                    style={{ animationDelay: `${i * 110}ms` }}
                  >
                    <div className="index">{String(i + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</div>
                    <div className="frame">
                      <img src={p.src} alt={p.caption || ''} loading="lazy" />
                    </div>
                    <figcaption className="cap">{p.caption || ''}</figcaption>
                  </figure>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {/* Message section stays hidden until the album is unlocked. */}
      {payload.message && albumUnlocked && (
        <>
          {!messageUnlocked && (
            <SurpriseGift
              label="One more little surprise"
              hint="Tap to unwrap ✿"
              onOpen={unlockMessage}
            />
          )}
          {messageUnlocked && (
            <>
              <div className="divider reveal"><span>a note</span></div>
              <section className="message-card message-unfurl" ref={messageRef}>
                <div className="message-shimmer" aria-hidden="true" />
                {renderRichText(payload.message)}
                {payload.from && (
                  <div className="signature">
                    {signoff}<br />
                    {payload.from}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}

      {/* Handwritten little note — appears folded, unfolds on tap */}
      {payload.extraNote && messageUnlocked && (
        <HandwrittenNote text={payload.extraNote} onOpen={() => setNoteOpened(true)} />
      )}

      {/* Shared soundtrack */}
      {songs.length > 0 && messageUnlocked && (
        <>
          <div className="divider reveal"><span>songs that sound like us</span></div>
          <section className="soundtrack">
            {songs.map((song, i) => {
              const inner = (
                <>
                  <div className="song-note" aria-hidden="true">♪</div>
                  <div className="song-info">
                    <div className="song-title">{song.title}</div>
                    {song.artist && <div className="song-artist">{song.artist}</div>}
                  </div>
                  {song.url && <div className="song-listen">listen ↗</div>}
                </>
              )
              return song.url ? (
                <a
                  key={i}
                  href={song.url}
                  target="_blank"
                  rel="noreferrer"
                  className="song-tile reveal"
                >
                  {inner}
                </a>
              ) : (
                <div key={i} className="song-tile reveal">{inner}</div>
              )
            })}
          </section>
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

      {/* Playful certificate — gated on the folded note being opened for suspense */}
      {payload.certificate && certGateReady && (
        <CertificateReveal
          payload={payload}
          recipientLabel={recipientLabel}
          onReveal={() => setCertRevealed(true)}
        />
      )}

      {/* Easter egg — one more, tucked at the very end (waits for the certificate) */}
      {payload.oneMore && oneMoreReady && (
        <div className="one-more reveal">
          {!oneMoreOpen ? (
            <button
              type="button"
              className="one-more-btn"
              onClick={() => setOneMoreOpen(true)}
            >
              <span className="om-flourish" aria-hidden="true">❦</span>
              <span className="om-text">one more?</span>
              <span className="om-flourish om-flip" aria-hidden="true">❦</span>
            </button>
          ) : (
            <div className="one-more-line">{payload.oneMore}</div>
          )}
        </div>
      )}

      {messageUnlocked && (
        <div className="footnote reveal">
          made with warmth · just for you
        </div>
      )}

      {/* Petals-burst greeting fires once when the wishes section enters view */}
      {nameBurst && payload.to && !embedded && (
        <div className="name-burst" aria-hidden="true">
          <div className="name-burst-bubble">hi, {payload.to} ✿</div>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className={`nb-petal nb-petal-${i}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// A folded note that unfolds when tapped — sits inline after the main message.
function HandwrittenNote({ text, onOpen }) {
  const [phase, setPhase] = useState('folded')
  // 'folded' -> 'unfolding' -> 'open'

  const handleOpen = () => {
    if (phase !== 'folded') return
    setPhase('unfolding')
    setTimeout(() => { setPhase('open'); onOpen?.() }, 750)
  }

  if (phase === 'open') {
    return (
      <section className="handwritten-note hw-unfurl-in">
        <div className="hw-tape" aria-hidden="true" />
        <div className="hw-body">{text}</div>
      </section>
    )
  }

  return (
    <div className={`hw-folded-wrap reveal${phase === 'unfolding' ? ' is-opening' : ''}`}>
      <button
        type="button"
        className="hw-folded"
        onClick={handleOpen}
        aria-label="Open the folded note"
      >
        <div className="hw-folded-paper">
          <div className="hw-fold-crease" aria-hidden="true" />
          <div className="hw-fold-shadow" aria-hidden="true" />
          <div className="hw-wax-seal" aria-hidden="true">
            <span className="hw-wax-emblem">✿</span>
          </div>
          <div className="hw-fold-corner hw-fold-corner-tl" aria-hidden="true" />
          <div className="hw-fold-corner hw-fold-corner-tr" aria-hidden="true" />
        </div>
      </button>
      <div className="hw-fold-hint">tap to unfold ✿</div>
    </div>
  )
}

// A sealed preview that unveils the certificate with fanfare on tap.
function CertificateReveal({ payload, recipientLabel, onReveal }) {
  const [phase, setPhase] = useState('sealed')
  // 'sealed' -> 'revealing' -> 'revealed'

  const handleReveal = () => {
    if (phase !== 'sealed') return
    setPhase('revealing')
    setTimeout(() => { setPhase('revealed'); onReveal?.() }, 900)
  }

  if (phase === 'revealed') {
    return <BestieCertificate payload={payload} recipientLabel={recipientLabel} entrance />
  }

  return (
    <div className={`cert-preview-wrap reveal${phase === 'revealing' ? ' is-revealing' : ''}`}>
      <button
        type="button"
        className="cert-preview"
        onClick={handleReveal}
        aria-label="Unveil your certificate"
      >
        <div className="cp-frame" aria-hidden="true" />
        <div className="cp-corner cp-corner-tl" aria-hidden="true">✦</div>
        <div className="cp-corner cp-corner-tr" aria-hidden="true">✦</div>
        <div className="cp-corner cp-corner-bl" aria-hidden="true">✦</div>
        <div className="cp-corner cp-corner-br" aria-hidden="true">✦</div>

        <div className="cp-sparkles" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={`cp-sp cp-sp-${i}`}>✦</span>
          ))}
        </div>

        <div className="cp-kicker">You've been awarded</div>

        <div className="cp-medallion-wrap" aria-hidden="true">
          <div className="cp-rays">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="cp-ray" style={{ transform: `rotate(${i * 30}deg)` }} />
            ))}
          </div>
          <div className="cp-medallion">
            <span className="cp-medallion-emblem">✿</span>
          </div>
        </div>

        <div className="cp-title">The Official {recipientLabel} Card</div>
        <div className="cp-hint">tap to unveil ✿</div>
      </button>
    </div>
  )
}

// The actual certificate — extracted so it can be revealed with entrance fanfare.
function BestieCertificate({ payload, recipientLabel, entrance = false }) {
  return (
    <section className={`bestie-cert${entrance ? ' cert-entrance' : ' reveal'}`}>
      <div className="bc-watermark" aria-hidden="true">✿</div>
      <div className="bc-sheen" aria-hidden="true" />

      <div className="bc-corner bc-corner-tl">✦</div>
      <div className="bc-corner bc-corner-tr">✦</div>
      <div className="bc-corner bc-corner-bl">✦</div>
      <div className="bc-corner bc-corner-br">✦</div>

      <div className="bc-ribbon"><span>OFFICIAL</span></div>

      <BestieCrest />

      <div className="bc-kicker">This certifies that</div>

      <div className="bc-name-frame">
        <span className="bc-name-flourish">❦</span>
        <div className="bc-name">{payload.to || 'you'}</div>
        <span className="bc-name-flourish flip">❦</span>
      </div>

      <div className="bc-title">is a certified {recipientLabel.toLowerCase()}, forever and always.</div>

      <div className="bc-rating">
        <span className="bc-stars" aria-label="5 stars">★ ★ ★ ★ ★</span>
        <span className="bc-rating-label">5-star {recipientLabel.toLowerCase()}</span>
      </div>

      <div className="bc-line" />

      <div className="bc-meta">
        <div>
          <div className="bc-meta-label">{recipientLabel} since</div>
          <div className="bc-meta-value">{payload.certSince || '—'}</div>
        </div>
        <div>
          <div className="bc-meta-label">Card №</div>
          <div className="bc-meta-value">1 of 1</div>
        </div>
      </div>

      <div className="bc-perks">
        <div className="bc-perks-title">Membership includes</div>
        <ul>
          {getPerks(payload.recipient).map((p, i) => (
            <li key={i}><span className="bc-perk-check">✓</span>{p}</li>
          ))}
        </ul>
      </div>

      {payload.from && (
        <div className="bc-signed">
          <span className="bc-signed-label">signed,</span>
          <span className="bc-signed-name">{payload.from}</span>
        </div>
      )}

      <BestieStamp recipient={payload.recipient} year={payload.certSince} />
    </section>
  )
}

// Membership perks per recipient — playful, tuned to the relationship.
function getPerks(recipient) {
  const map = {
    'bestie': [
      'Unlimited access to inside jokes',
      '3am message privileges, no questions asked',
      'One shared brain, permanent lease',
    ],
    'office-bestie': [
      'Emergency meeting escape coordination',
      'Sneaky lunch alliance, activated',
      'Silent eye-roll telepathy, verified',
    ],
    'sister': [
      'Automatic wardrobe borrowing rights',
      'Forever ally in every argument',
      'Family group-chat co-conspirator',
    ],
    'sister-from-another': [
      'Chosen family, no takebacks',
      'Home-away-from-home privileges',
      'Sister status, notarized ✦',
    ],
  }
  return map[recipient] || map['bestie']
}

// Ornate central crest — floral badge that fills the head of the certificate
function BestieCrest() {
  return (
    <div className="bc-crest-wrap" aria-hidden="true">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" className="bc-crest-svg">
        <defs>
          <radialGradient id="bcCrestGold" cx="50%" cy="35%" r="70%">
            <stop offset="0" stopColor="var(--accent-soft)" />
            <stop offset="0.55" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-deep)" />
          </radialGradient>
        </defs>

        {/* Ornate wreath — laurel leaves left */}
        <g fill="var(--accent-deep)" opacity="0.85">
          <path d="M 22 60 q -6 -18 6 -30 q 4 8 -2 20 z" />
          <path d="M 20 74 q -8 -12 -2 -26 q 6 6 4 20 z" />
          <path d="M 22 88 q -8 -6 -8 -20 q 8 4 10 16 z" />
        </g>
        {/* Laurel leaves right (mirrored) */}
        <g fill="var(--accent-deep)" opacity="0.85">
          <path d="M 98 60 q 6 -18 -6 -30 q -4 8 2 20 z" />
          <path d="M 100 74 q 8 -12 2 -26 q -6 6 -4 20 z" />
          <path d="M 98 88 q 8 -6 8 -20 q -8 4 -10 16 z" />
        </g>

        {/* Central medallion */}
        <circle cx="60" cy="60" r="30" fill="url(#bcCrestGold)" stroke="var(--accent-deep)" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="26" fill="none" stroke="rgba(255,253,249,0.55)" strokeWidth="1" strokeDasharray="1 3" />

        {/* Central floral emblem */}
        <g transform="translate(60 60)">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx="0" cy="-11"
              rx="6" ry="9"
              fill="#fffdf9"
              opacity="0.9"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="5" fill="var(--accent-deep)" />
          <circle cx="0" cy="0" r="2" fill="#fffdf9" />
        </g>

        {/* Ribbon banner across the bottom of the medallion */}
        <g transform="translate(60 96)">
          <path d="M -34 -5 L 34 -5 L 40 2 L 34 9 L -34 9 L -40 2 Z"
                fill="var(--accent-deep)" />
          <path d="M -34 -5 L 34 -5 L 40 2 L 34 9 L -34 9 L -40 2 Z"
                fill="none" stroke="rgba(255,253,249,0.35)" strokeWidth="0.6" />
          <text x="0" y="4.5" textAnchor="middle"
                fontFamily="Nunito, sans-serif" fontSize="7.5" fontWeight="800"
                letterSpacing="1.8" fill="#fffdf9">✦ FOREVER ✦</text>
        </g>

        {/* Sparkles above */}
        <g fill="var(--accent-deep)" opacity="0.7">
          <path d="M 60 12 l 1.5 3 l 3 1 l -3 1 l -1.5 3 l -1.5 -3 l -3 -1 l 3 -1 z" />
          <path d="M 44 20 l 1 2 l 2 .7 l -2 .7 l -1 2 l -1 -2 l -2 -.7 l 2 -.7 z" opacity="0.6" />
          <path d="M 76 20 l 1 2 l 2 .7 l -2 .7 l -1 2 l -1 -2 l -2 -.7 l 2 -.7 z" opacity="0.6" />
        </g>
      </svg>
    </div>
  )
}

// Circular rubber stamp — "BESTIES FOREVER · SEALED WITH LOVE"
function BestieStamp({ recipient, year }) {
  const foreverTextMap = {
    'bestie':               'BESTIES FOREVER',
    'office-bestie':        'BESTIES FOREVER',
    'sister':               'SISTERS FOREVER',
    'sister-from-another':  'SISTERS FOREVER',
  }
  const stampText = foreverTextMap[recipient] || 'BESTIES FOREVER'
  const arc = `✦ ${stampText} ✦ SEALED WITH LOVE `

  return (
    <div className="bc-stamp-wrap" aria-hidden="true">
      <svg className="bc-stamp" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path id="bc-stamp-arc" d="M 100,100 m -72,0 a 72,72 0 1,1 144,0 a 72,72 0 1,1 -144,0" />
        </defs>

        {/* Outer dashed halo */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
        {/* Main double ring */}
        <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="100" cy="100" r="83" fill="none" stroke="currentColor" strokeWidth="1" />
        {/* Inner divider ring */}
        <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="1.5" />

        {/* Circular text — repeats around the ring */}
        <text
          fontFamily="Nunito, ui-sans-serif, system-ui, sans-serif"
          fontSize="12.5"
          fontWeight="800"
          letterSpacing="2.5"
          fill="currentColor"
        >
          <textPath href="#bc-stamp-arc" startOffset="0">{arc}</textPath>
        </text>

        {/* Center content */}
        <text
          x="100" y="86"
          textAnchor="middle"
          fontFamily="Nunito, sans-serif"
          fontSize="10"
          fontWeight="800"
          letterSpacing="3"
          fill="currentColor"
        >EST.</text>
        <text
          x="100" y="116"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          fontSize="26"
          fontWeight="600"
          fill="currentColor"
        >{year || '∞'}</text>

        {/* Side accents */}
        <line x1="52" y1="100" x2="72" y2="100" stroke="currentColor" strokeWidth="1.5" />
        <line x1="128" y1="100" x2="148" y2="100" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="48" cy="100" r="1.6" fill="currentColor" />
        <circle cx="152" cy="100" r="1.6" fill="currentColor" />
      </svg>
    </div>
  )
}
