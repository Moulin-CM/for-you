// Downscale + JPEG-compress an image file to a base64 data URL small enough
// to embed in a shareable URL. Longest side capped, quality tuned for photos.
// HEIC/HEIF (iPhone) files are decoded via heic2any first — canvas cannot
// decode them natively in most browsers.

const MAX_EDGE = 1100
const QUALITY = 0.78

function isHeic(file) {
  const name = (file.name || '').toLowerCase()
  const type = (file.type || '').toLowerCase()
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    type === 'image/heic-sequence' ||
    type === 'image/heif-sequence' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

async function heicToJpegBlob(file) {
  // Dynamic import so heic2any only downloads when someone actually uses HEIC.
  const mod = await import('heic2any')
  const heic2any = mod.default || mod
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  // heic2any returns a Blob (or array of Blobs for multi-frame HEIC).
  return Array.isArray(result) ? result[0] : result
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { resolve(img); /* keep url — revoked by caller after use */ }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode-failed')) }
    img.src = url
    img._objectUrl = url
  })
}

export async function compressImageFile(file) {
  let sourceBlob = file
  if (isHeic(file)) {
    try {
      sourceBlob = await heicToJpegBlob(file)
    } catch (e) {
      throw new Error('heic-decode-failed')
    }
  }
  const img = await loadImageFromBlob(sourceBlob)
  try {
    const { naturalWidth: width, naturalHeight: height } = img
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', QUALITY)
  } finally {
    if (img._objectUrl) URL.revokeObjectURL(img._objectUrl)
  }
}

export function approximateSizeKB(dataUrl) {
  const commaIdx = dataUrl.indexOf(',')
  const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl
  return Math.round((b64.length * 3) / 4 / 1024)
}
