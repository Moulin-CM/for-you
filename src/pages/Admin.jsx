import { useEffect, useMemo, useRef, useState } from 'react'
import Gift from './Gift.jsx'
import { OCCASIONS, RECIPIENTS, DEFAULT_OCCASION, DEFAULT_RECIPIENT } from '../theme/occasions.js'
import { buildShareUrl, buildShortUrl } from '../utils/payload.js'
import { approximateSizeKB, compressImageFile } from '../utils/image.js'
import { slugify, suggestSlug } from '../utils/slug.js'
import { clearPAT, commitGift, getPAT, savePAT } from '../utils/github.js'
import { REPO_NAME, REPO_OWNER } from '../config.js'

const empty = {
  recipient: DEFAULT_RECIPIENT,
  occasion: DEFAULT_OCCASION,
  to: '',
  from: '',
  lede: '',
  message: '',
  signoff: '',
  photos: [],   // [{ src, caption }]
  surprises: [''],
  includeGames: true,
}

export default function Admin() {
  const [state, setState] = useState(empty)
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef(null)

  const update = (patch) => setState((s) => ({ ...s, ...patch }))

  const payload = state

  // Auto-suggest a slug from from/to/occasion until the user edits it.
  useEffect(() => {
    if (!slugTouched) {
      setSlug(suggestSlug({ from: state.from, to: state.to, occasion: state.occasion }))
    }
  }, [state.from, state.to, state.occasion, slugTouched])

  // Cache the current draft under its slug so the short link renders instantly
  // in this browser — no commit/deploy needed to preview. A real committed
  // JSON file always wins over this cache in Gift.jsx.
  useEffect(() => {
    if (!slug) return
    const id = setTimeout(() => {
      try { localStorage.setItem(`gift:${slug}`, JSON.stringify(state)) } catch { /* full or blocked */ }
    }, 250)
    return () => clearTimeout(id)
  }, [slug, state])

  const shareUrl = useMemo(() => {
    try { return buildShareUrl(payload) } catch { return '' }
  }, [payload])
  const shortUrl = useMemo(() => (slug ? buildShortUrl(slug) : ''), [slug])

  const totalKB = useMemo(() => {
    return payload.photos.reduce((sum, p) => sum + approximateSizeKB(p.src || ''), 0)
  }, [payload.photos])

  async function handleFiles(fileList) {
    setBusy(true)
    setUploadError('')
    const files = Array.from(fileList)
    const isImageLike = (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)
    const usable = files.filter(isImageLike)
    if (usable.length < files.length) {
      setUploadError('Some files were skipped — only image files are accepted.')
    }
    const compressed = []
    const failures = []
    for (const f of usable) {
      try {
        const src = await compressImageFile(f)
        compressed.push({ src, caption: '' })
      } catch (e) {
        failures.push(`${f.name} (${e.message || 'failed'})`)
      }
    }
    if (failures.length) {
      setUploadError(`Couldn't read: ${failures.join(', ')}`)
    }
    setState((s) => ({ ...s, photos: [...s.photos, ...compressed].slice(0, 12) }))
    setBusy(false)
  }

  function removePhoto(i) {
    setState((s) => ({ ...s, photos: s.photos.filter((_, idx) => idx !== i) }))
  }
  function setPhotoCaption(i, caption) {
    setState((s) => ({ ...s, photos: s.photos.map((p, idx) => idx === i ? { ...p, caption } : p) }))
  }

  function setSurprise(i, val) {
    setState((s) => ({ ...s, surprises: s.surprises.map((x, idx) => idx === i ? val : x) }))
  }
  function addSurprise() {
    setState((s) => ({ ...s, surprises: [...s.surprises, ''] }))
  }
  function removeSurprise(i) {
    setState((s) => ({ ...s, surprises: s.surprises.filter((_, idx) => idx !== i) }))
  }

  async function copyText(text, ok = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text)
      setCopyMsg(ok)
    } catch {
      setCopyMsg('Copy failed — select and copy manually.')
    }
    setTimeout(() => setCopyMsg(''), 2200)
  }

  function openInNewTab(url) {
    window.open(url, '_blank', 'noopener')
  }

  function reset() {
    if (confirm('Clear everything and start over?')) {
      setState(empty)
      setSlugTouched(false)
    }
  }

  const [drag, setDrag] = useState(false)
  function onDrop(e) {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  // ---------- Publish flow ----------
  const [pat, setPat] = useState(() => getPAT())
  const [patInput, setPatInput] = useState('')
  const [showPatSetup, setShowPatSetup] = useState(false)
  const [publishState, setPublishState] = useState({ status: 'idle', msg: '', url: '' })
  // status: 'idle' | 'publishing' | 'ok' | 'err'

  function savePat() {
    const t = patInput.trim()
    if (!t) return
    savePAT(t)
    setPat(t)
    setPatInput('')
    setShowPatSetup(false)
    setPublishState({ status: 'idle', msg: '', url: '' })
  }
  function forgetPat() {
    if (!confirm('Remove the token from this browser? You will need to paste it again to publish.')) return
    clearPAT()
    setPat('')
  }

  async function publish() {
    if (!slug) { setPublishState({ status: 'err', msg: 'Please give it a slug first.', url: '' }); return }
    if (!pat) { setShowPatSetup(true); return }
    setPublishState({ status: 'publishing', msg: '', url: '' })
    try {
      const { shortUrl } = await commitGift({ slug, payload, token: pat })
      setPublishState({ status: 'ok', msg: 'Published! The link works within a minute.', url: shortUrl })
    } catch (e) {
      setPublishState({ status: 'err', msg: e.message || 'Something went wrong.', url: '' })
    }
  }

  return (
    <div className="admin">
      <form className="admin-form" onSubmit={(e) => e.preventDefault()}>
        <h2>Surprise Studio</h2>
        <p className="sub">Nothing leaves your device. You choose how to share.</p>

        <div className="field">
          <label>Who is this for?</label>
          <div className="chips">
            {Object.values(RECIPIENTS).map((r) => (
              <button
                type="button"
                key={r.id}
                className={`chip${state.recipient === r.id ? ' active' : ''}`}
                onClick={() => update({ recipient: r.id })}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
            {RECIPIENTS[state.recipient]?.helperText}
          </p>
        </div>

        <div className="field">
          <label>Occasion</label>
          <div className="chips">
            {Object.values(OCCASIONS).map((o) => (
              <button
                type="button"
                key={o.id}
                className={`chip${state.occasion === o.id ? ' active' : ''}`}
                onClick={() => update({ occasion: o.id })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Mini-games (occasion-specific, always skippable)</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--ink)', cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
            <input
              type="checkbox"
              checked={state.includeGames}
              onChange={(e) => update({ includeGames: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            Gate the album + message behind a tiny game
          </label>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
            {state.occasion === 'birthday' && 'Blow out candles → album · Untie the gift box → message'}
            {state.occasion === 'rakhi' && 'Tie the rakhi → album · Open the mithai box → message'}
            {state.occasion === 'friendship' && 'Bloom the flower → album · Catch three stars → message'}
          </p>
        </div>

        <div className="field">
          <label>Her name (as it will appear)</label>
          <input
            type="text"
            value={state.to}
            onChange={(e) => update({ to: e.target.value })}
            placeholder="e.g. Kali"
          />
        </div>

        <div className="field">
          <label>Signed by (optional)</label>
          <input
            type="text"
            value={state.from}
            onChange={(e) => update({ from: e.target.value })}
            placeholder="e.g. Moulin"
          />
        </div>

        <div className="field">
          <label>Short opening line (optional — overrides default)</label>
          <input
            type="text"
            value={state.lede}
            onChange={(e) => update({ lede: e.target.value })}
            placeholder="A single soft sentence for the top of the page"
          />
        </div>

        <div className="field">
          <label>Photos ({state.photos.length}/12) · ~{totalKB} KB · HEIC / JPG / PNG</label>
          <label
            className={`uploader${drag ? ' drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {busy ? 'Compressing…' : 'Drop photos here, or tap to pick'}
          </label>
          {uploadError && (
            <p style={{ fontSize: 12, color: '#b0453e', margin: '6px 0 0' }}>{uploadError}</p>
          )}

          {state.photos.length > 0 && (
            <div className="photo-caption-editor">
              {state.photos.map((p, i) => (
                <div key={i} className="row">
                  <img src={p.src} alt="" />
                  <input
                    type="text"
                    placeholder="a little caption (optional)"
                    value={p.caption}
                    onChange={(e) => setPhotoCaption(i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    style={{ background: 'transparent', border: 0, color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}
                    aria-label="Remove photo"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>The heartfelt message · use *word* for bold, _word_ for italic</label>
          <textarea
            value={state.message}
            onChange={(e) => update({ message: e.target.value })}
            placeholder="Write it in your own voice. Line breaks are kept. *Bold* and _italic_ work."
          />
        </div>

        <div className="field">
          <label>Sign-off (optional — overrides default)</label>
          <input
            type="text"
            value={state.signoff}
            onChange={(e) => update({ signoff: e.target.value })}
            placeholder='e.g. "always in your corner,"'
          />
        </div>

        <div className="field">
          <label>Little surprises / wishes (each shows as a tile)</label>
          <ul className="mini-list">
            {state.surprises.map((s, i) => (
              <li key={i}>
                <input
                  type="text"
                  value={s}
                  onChange={(e) => setSurprise(i, e.target.value)}
                  placeholder="An inside joke, a wish, a memory…"
                />
                <button type="button" onClick={() => removeSurprise(i)} aria-label="Remove">−</button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn ghost small" onClick={addSurprise} style={{ marginTop: 8 }}>
            + add another
          </button>
        </div>

        {/* Publish */}
        <div className="share-box">
          <div style={{ fontWeight: 700, color: 'var(--accent-deep)' }}>Publish & share</div>

          <div className="field" style={{ margin: '10px 0 6px' }}>
            <label>Slug (the friendly bit of the URL)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true) }}
              placeholder="e.g. moulin-for-kali-birthday"
              aria-label="Slug"
            />
          </div>
          <div className="url" title="The link your recipient will open.">{shortUrl || '—'}</div>

          {/* PAT setup (first time on this browser, or if user clicked change) */}
          {(showPatSetup || !pat) && (
            <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 8 }}>
                One-time setup on this browser. Create a fine-grained GitHub token so this page can commit gift files for you.
              </div>
              <ol style={{ fontSize: 12, color: 'var(--ink-soft)', paddingLeft: 18, margin: '0 0 10px', lineHeight: 1.55 }}>
                <li>
                  Open{' '}
                  <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                    github.com/settings/personal-access-tokens/new
                  </a>.
                </li>
                <li><b>Repository access</b> → Only select repositories → <code>{REPO_OWNER}/{REPO_NAME}</code>.</li>
                <li><b>Repository permissions</b> → <b>Contents</b>: Read and write.</li>
                <li>Generate the token, copy it, and paste below.</li>
              </ol>
              <input
                type="password"
                autoComplete="new-password"
                value={patInput}
                onChange={(e) => setPatInput(e.target.value)}
                placeholder="github_pat_…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, font: 'inherit' }}
              />
              <div className="actions" style={{ marginTop: 8 }}>
                <button type="button" className="btn" onClick={savePat} disabled={!patInput.trim()}>Save token</button>
                {pat && <button type="button" className="btn ghost small" onClick={() => setShowPatSetup(false)}>Cancel</button>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                The token stays in this browser's localStorage. It is never sent to any server except github.com.
              </div>
            </div>
          )}

          <div className="actions">
            <button
              type="button"
              className="btn"
              onClick={publish}
              disabled={publishState.status === 'publishing' || !slug}
            >
              {publishState.status === 'publishing' ? 'Publishing…' : (pat ? 'Publish surprise' : 'Set up token & publish')}
            </button>
            <button type="button" className="btn ghost" onClick={() => copyText(shortUrl, 'Link copied!')} disabled={!shortUrl}>
              Copy link
            </button>
            {pat && !showPatSetup && (
              <button type="button" className="btn ghost small" onClick={() => setShowPatSetup(true)}>Change token</button>
            )}
            {pat && !showPatSetup && (
              <button type="button" className="btn ghost small" onClick={forgetPat}>Forget token</button>
            )}
          </div>
          {publishState.status === 'ok' && (
            <div style={{ marginTop: 10, padding: 10, background: '#eaf4e6', border: '1px solid #b5d5a3', borderRadius: 8, color: '#3a5a2e', fontSize: 13 }}>
              ✓ {publishState.msg}
              <div style={{ marginTop: 4 }}>
                <a href={publishState.url} target="_blank" rel="noreferrer">{publishState.url}</a>
              </div>
            </div>
          )}
          {publishState.status === 'err' && (
            <div style={{ marginTop: 10, padding: 10, background: '#f9e6e2', border: '1px solid #d9a89f', borderRadius: 8, color: '#8f3a2c', fontSize: 13 }}>
              {publishState.msg}
            </div>
          )}
          {copyMsg && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent-deep)' }}>{copyMsg}</div>}
        </div>

        {/* Self-contained fallback — for when you can't/don't want to publish */}
        <details className="share-box" style={{ background: 'linear-gradient(135deg, #f4f0ea, #fffefc)', borderColor: 'var(--border)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--ink)' }}>
            Or use a self-contained link (no publish needed)
          </summary>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '8px 0' }}>
            The entire gift lives inside this URL — great for a quick text-only note. Painful for photo-heavy ones because it gets very long.
          </div>
          <div className="url">{shareUrl || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8 }}>
            Length: {shareUrl.length.toLocaleString()} chars
            {shareUrl.length > 8000 && ' · getting long — Publish above is better'}
          </div>
          <div className="actions">
            <button type="button" className="btn ghost" onClick={() => copyText(shareUrl)}>Copy long link</button>
            <button type="button" className="btn ghost" onClick={() => openInNewTab(shareUrl)}>Open in new tab</button>
            <button type="button" className="btn ghost small" onClick={reset}>Reset</button>
          </div>
        </details>
      </form>

      <aside className="preview-panel">
        <div className="head">
          <span>Live preview</span>
          <span>The envelope + petals only appear on the real link.</span>
        </div>
        <div className="body">
          <Gift payload={payload} embedded />
        </div>
      </aside>
    </div>
  )
}
