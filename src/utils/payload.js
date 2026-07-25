import LZString from 'lz-string'

// Encode/decode the full gift payload into a URL-safe compressed string.
// We store it in the URL fragment (`#/gift?d=...`) so it never leaves the browser.

export function encodePayload(payload) {
  const json = JSON.stringify(payload)
  return LZString.compressToEncodedURIComponent(json)
}

export function decodePayload(encoded) {
  if (!encoded) return null
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function buildShareUrl(payload) {
  const encoded = encodePayload(payload)
  const base = window.location.origin + window.location.pathname
  return `${base}#/gift?d=${encoded}`
}

export function buildShortUrl(slug) {
  const base = window.location.origin + window.location.pathname
  return `${base}#/g/${encodeURIComponent(slug)}`
}
