import { REPO_OWNER, REPO_NAME, REPO_BRANCH, GIFTS_DIR } from '../config.js'

const API   = 'https://api.github.com'
const RAW   = 'https://raw.githubusercontent.com'
const PAT_KEY = 'for-you:pat'

// ---------- PAT storage (localStorage only, never sent anywhere else) ----------

export function getPAT() {
  try { return localStorage.getItem(PAT_KEY) || '' } catch { return '' }
}
export function savePAT(token) {
  try { localStorage.setItem(PAT_KEY, token.trim()) } catch { /* full or blocked */ }
}
export function clearPAT() {
  try { localStorage.removeItem(PAT_KEY) } catch { /* ignore */ }
}

// ---------- Publish: commit or update a gift file via the Contents API ----------

function pathFor(slug) {
  return `${GIFTS_DIR}/${slug}.json`
}

async function apiGet(path, token) {
  return fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
}

function utf8ToBase64(str) {
  // Handle non-ASCII chars (emoji, accents) safely.
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

/**
 * Commit (or update) a gift JSON file to REPO_OWNER/REPO_NAME on REPO_BRANCH.
 * Returns { commitUrl, shortUrl }.
 */
export async function commitGift({ slug, payload, token }) {
  if (!slug) throw new Error('missing-slug')
  if (!token) throw new Error('missing-token')

  const path = pathFor(slug)
  const contentBase64 = utf8ToBase64(JSON.stringify(payload, null, 2))

  // See if a file already exists (so we can update via sha).
  const existing = await apiGet(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${REPO_BRANCH}`,
    token,
  )
  let sha = null
  if (existing.ok) {
    const data = await existing.json()
    sha = data.sha
  } else if (existing.status !== 404) {
    const txt = await existing.text()
    throw new Error(`Could not check for existing file (${existing.status}): ${txt.slice(0, 160)}`)
  }

  const body = {
    message: sha ? `Update gift ${slug}` : `Add gift ${slug}`,
    content: contentBase64,
    branch: REPO_BRANCH,
  }
  if (sha) body.sha = sha

  const put = await fetch(
    `${API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  if (!put.ok) {
    const txt = await put.text()
    if (put.status === 401 || put.status === 403) {
      throw new Error('The token was refused. It may be missing "Contents: Read and write" on this repo, or it may have expired.')
    }
    if (put.status === 404) {
      throw new Error(`Repo ${REPO_OWNER}/${REPO_NAME} not found or the token doesn't have access to it.`)
    }
    throw new Error(`Publish failed (${put.status}): ${txt.slice(0, 200)}`)
  }
  const data = await put.json()
  return {
    commitUrl: data.commit?.html_url,
    shortUrl: `${window.location.origin}${window.location.pathname}#/g/${slug}`,
  }
}

// ---------- Read: fetch a published gift by slug (unauthenticated) ----------

export async function fetchRawGift(slug) {
  const url = `${RAW}/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${GIFTS_DIR}/${slug}.json`
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error('not-found')
  return await res.json()
}
