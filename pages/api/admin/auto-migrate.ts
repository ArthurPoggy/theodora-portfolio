import type { NextApiRequest, NextApiResponse } from 'next'
import { put, list } from '@vercel/blob'
import { getBlobSection, putBlobSection } from '@/lib/blob'
import { generateImageVariants } from '@/lib/media-server'
import type { GalleryImage, MediaVariants, MediaVariantSize } from '@/types/cms'
import { isAuthenticated } from '@/lib/auth'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

const SECTIONS = ['galleries', 'animations', 'about', 'home', 'overlays']
const BATCH_DEFAULT = 3

interface MigrateRequest {
  batch?: number
}

function isAllowed(req: NextApiRequest): boolean {
  // Aceita INTERNAL_API_KEY ou BLOB_READ_WRITE_TOKEN (que sempre existe quando há Blob conectado)
  const key = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (key && req.headers['x-internal-key'] === key) return true
  return isAuthenticated(req)
}

/**
 * Encontra e processa, em batches, paths legados nos JSONs do CMS:
 *   - /api/media/<dir>/<file>
 *   - URLs antigas tipo *.blob.vercel-storage.com/* sem variants
 *
 * Idempotente: pula descriptors que já têm `variants`.
 * POST sem body: processa um batch e retorna { remaining }.
 * GET: retorna apenas a contagem pendente.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAllowed(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })

  if (req.method === 'GET') {
    const pending = await countPending()
    return res.status(200).json({ ok: true, pending })
  }

  if (req.method !== 'POST') return res.status(405).end()

  const { batch = BATCH_DEFAULT } = (req.body || {}) as MigrateRequest

  try {
    const result = await processBatch(batch)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) })
  }
}

interface PendingItem {
  section: string
  pointer: string                  // JSON pointer ou descrição
  src: string                      // URL atual
}

async function countPending(): Promise<number> {
  let count = 0
  for (const section of SECTIONS) {
    const items = await findPendingInSection(section)
    count += items.length
  }
  return count
}

async function processBatch(batch: number): Promise<{
  processed: number
  remaining: number
  errors: string[]
}> {
  const errors: string[] = []
  let processed = 0

  for (const section of SECTIONS) {
    if (processed >= batch) break
    const items = await findPendingInSection(section)
    if (items.length === 0) continue

    const content = await getBlobSection(section)
    if (!content) continue
    let json = content
    let dirty = false

    for (const item of items) {
      if (processed >= batch) break
      try {
        const newDescriptor = await processOne(item.src)
        const oldFragment = JSON.stringify({ src: item.src })
        // Substitui qualquer descriptor exato com aquele src
        // Mais robusto: stringify do JSON, busca/substitui por regex baseado em src
        json = replaceDescriptor(json, item.src, newDescriptor)
        dirty = true
        processed += 1
      } catch (e) {
        errors.push(`${section}/${item.src}: ${String(e)}`)
      }
    }

    if (dirty) await putBlobSection(section, json)
  }

  const remaining = await countPending()
  return { processed, remaining, errors }
}

/**
 * Encontra recursivamente objetos `{ src: ... }` com URLs que ainda precisam
 * ser processadas (path legado OU descriptor sem variants).
 */
async function findPendingInSection(section: string): Promise<PendingItem[]> {
  const content = await getBlobSection(section)
  if (!content) return []
  let data: unknown
  try { data = JSON.parse(content) } catch { return [] }
  const out: PendingItem[] = []
  walk(data, (obj) => {
    if (!obj || typeof obj !== 'object') return
    const o = obj as Record<string, unknown>
    const src = typeof o.src === 'string' ? o.src : undefined
    if (!src) return
    // Skip se já é descriptor otimizado
    if (o.variants && typeof o.variants === 'object') return
    // Skip se for SVG local ou track de áudio
    if (src.startsWith('/images/') || src.startsWith('/audio/')) return
    if (/\.(mp3|ogg|wav|m4a)$/i.test(src)) return
    // Skip se for video (sem optimization de variants neste momento)
    if (/\.(mp4|webm|mov)$/i.test(src) || o.kind === 'video') return
    // Skip se for embed Spotify
    if (src.includes('spotify.com/embed')) return
    // Skip se for asset hardcoded antigo (gif-*.gif sem ser blob)
    if (src.startsWith('/') && !src.startsWith('/api/')) return

    out.push({ section, pointer: '', src })
  })
  return out
}

function walk(obj: unknown, visit: (o: unknown) => void) {
  if (!obj) return
  visit(obj)
  if (Array.isArray(obj)) {
    for (const item of obj) walk(item, visit)
  } else if (typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) walk(v, visit)
  }
}

async function processOne(sourceUrl: string): Promise<GalleryImage> {
  const resolvedUrl = await resolvePublicUrl(sourceUrl)
  const pathname = extractPathname(resolvedUrl)
  const buffer = await downloadBuffer(resolvedUrl)
  const { buffers, lqip, width, height } = await generateImageVariants(buffer)

  const stem = pathname.replace(/\.[^.]+$/, '')
  const variants: MediaVariants = { webp: {}, avif: {} }
  let largestWebp: string | undefined

  for (const { size, format, buffer: buf } of buffers) {
    const variantPath = `${stem}.${size}.${format}`
    const result = await put(variantPath, buf, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: format === 'webp' ? 'image/webp' : 'image/avif',
      cacheControlMaxAge: 31536000,
    })
    if (format === 'webp') {
      variants.webp[size as MediaVariantSize] = result.url
      largestWebp = result.url
    } else {
      if (!variants.avif) variants.avif = {}
      variants.avif[size as MediaVariantSize] = result.url
    }
  }

  return {
    src: largestWebp ?? resolvedUrl,
    alt: '',
    kind: 'image',
    variants,
    original: resolvedUrl,
    width,
    height,
    lqip,
  }
}

/** Resolve URL para uma URL pública direta do CDN */
async function resolvePublicUrl(url: string): Promise<string> {
  // Já é pública
  if (url.includes('.public.blob.vercel-storage.com')) return url
  // Proxy → resolve via list
  const pathname = extractPathname(url)
  if (!pathname) throw new Error(`Pathname inválido: ${url}`)
  const { blobs } = await list({ prefix: pathname, limit: 1 })
  const match = blobs.find((b) => b.pathname === pathname)
  if (!match) throw new Error(`Blob não encontrado: ${pathname}`)
  return match.url
}

function extractPathname(url: string): string {
  const m = url.match(/\.blob\.vercel-storage\.com\/(.+?)(?:\?|$)/)
  if (m) return m[1]
  const proxy = url.match(/\/api\/media\/(.+?)(?:\?|$)/)
  if (proxy) return `media/${proxy[1]}`
  if (url.startsWith('media/')) return url
  return url.replace(/^\//, '')
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const headers: HeadersInit = url.includes('.public.blob.vercel-storage.com')
    ? {}
    : { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`fetch falhou: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Substitui o descriptor com o src dado pelo descriptor novo dentro da string
 * JSON crua. Estratégia: procurar `"src": "<url>"` precedido pela abertura do
 * objeto e estender até o fechamento do objeto correspondente.
 *
 * Mais simples: parse, mutate, stringify — preserva ordem se usar JSON.parse.
 */
function replaceDescriptor(json: string, oldSrc: string, newDescriptor: GalleryImage): string {
  const data = JSON.parse(json)
  walk(data, (obj) => {
    if (!obj || typeof obj !== 'object') return
    const o = obj as Record<string, unknown>
    if (o.src === oldSrc && !(o.variants && typeof o.variants === 'object')) {
      // Preserva alt/title/description existentes
      const preserved: Partial<GalleryImage> = {
        alt: (o.alt as string) ?? newDescriptor.alt,
        title: o.title as string | undefined,
        description: o.description as string | undefined,
      }
      Object.assign(o, newDescriptor, preserved)
    }
  })
  return JSON.stringify(data, null, 2)
}
