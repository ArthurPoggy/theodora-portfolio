/**
 * Wrapper server-side para o ImageKit Media Library:
 *   - Upload via Basic Auth (`privateKey:`) — sem signature/expire/token
 *   - Leitura de JSON via URL pública do CDN (CORS liberado)
 *   - Listagem e delete via REST API quando necessário
 *
 * Sobrescreve o `lib/blob.ts` (Vercel Blob) — guarda os JSONs do CMS em
 * `cms/<section>.json` na Media Library, servidos publicamente pelo CDN.
 *
 * Mídias decorativas (imagens/vídeos/GIFs/áudio) ficam em `media/<dir>/<file>`.
 */

const UPLOAD_ENDPOINT = 'https://upload.imagekit.io/api/v1/files/upload'
const API_BASE = 'https://api.imagekit.io/v1'

function endpoint(): string {
  const ep = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  if (!ep) throw new Error('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ausente')
  return ep.replace(/\/$/, '')
}

function basicAuthHeader(): string {
  const key = process.env.IMAGEKIT_PRIVATE_KEY
  if (!key) throw new Error('IMAGEKIT_PRIVATE_KEY ausente')
  // Atenção: o dois-pontos final é obrigatório (privateKey:)
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

export function isImageKitStorageEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT && process.env.IMAGEKIT_PRIVATE_KEY)
}

/** Faz upload de bytes pro ImageKit usando Basic Auth (server-side). */
export async function uploadToImageKit(opts: {
  buffer: Buffer | Uint8Array | string
  fileName: string
  folder: string
  contentType?: string
  overwrite?: boolean
}): Promise<{ url: string; fileId: string; filePath: string }> {
  const form = new FormData()
  const blob = typeof opts.buffer === 'string'
    ? new Blob([opts.buffer], { type: opts.contentType || 'application/octet-stream' })
    : new Blob([opts.buffer], { type: opts.contentType || 'application/octet-stream' })
  form.append('file', blob, opts.fileName)
  form.append('fileName', opts.fileName)
  form.append('folder', opts.folder)
  form.append('useUniqueFileName', 'false')
  form.append('overwriteFile', opts.overwrite === false ? 'false' : 'true')

  const res = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: basicAuthHeader() },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ImageKit upload failed (${res.status}): ${err}`)
  }
  const json = await res.json()
  return { url: json.url, fileId: json.fileId, filePath: json.filePath }
}

/**
 * Lê um JSON do CMS direto do CDN público.
 * Cache-bust com timestamp pra garantir leitura fresh após gravação recente.
 */
export async function getImageKitJson(section: string): Promise<string | null> {
  try {
    const url = `${endpoint()}/cms/${section}.json?ts=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** Grava um JSON no ImageKit (sobrescreve se já existir). */
export async function putImageKitJson(section: string, content: string): Promise<void> {
  await uploadToImageKit({
    buffer: content,
    fileName: `${section}.json`,
    folder: 'cms',
    contentType: 'application/json',
    overwrite: true,
  })
}

/** Lista arquivos numa pasta. Útil para o script de migração. */
export async function listImageKitFiles(path: string): Promise<Array<{ name: string; filePath: string; url: string }>> {
  const res = await fetch(`${API_BASE}/files?path=${encodeURIComponent(path)}&limit=1000`, {
    headers: { Authorization: basicAuthHeader() },
  })
  if (!res.ok) throw new Error(`ImageKit list failed (${res.status})`)
  const json = await res.json() as Array<{ name: string; filePath: string; url: string }>
  return json
}
