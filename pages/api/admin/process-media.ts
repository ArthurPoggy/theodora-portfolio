import type { NextApiRequest, NextApiResponse } from 'next'
import { put, head, list } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'
import { generateImageVariants, VARIANT_SIZES } from '@/lib/media-server'
import type { GalleryImage, MediaVariants, MediaVariantSize } from '@/types/cms'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

interface ProcessMediaRequest {
  /** URL pública do CDN (preferido) ou pathname relativo */
  url?: string
  pathname?: string
  /** Tipo da mídia */
  kind: 'image' | 'video'
  /** Metadata para o descriptor */
  alt?: string
  title?: string
  description?: string
}

/** Aceita ?internal=<key> ou cookie de admin como autenticação */
function isAllowed(req: NextApiRequest): boolean {
  const internalKey = process.env.INTERNAL_API_KEY
  if (internalKey && req.headers['x-internal-key'] === internalKey) return true
  return isAuthenticated(req)
}

/**
 * Recebe uma URL/pathname de mídia já no Vercel Blob e retorna um
 * MediaDescriptor com variantes responsivas (imagens) ou metadata (vídeos).
 * Idempotente: se as variantes já existem, sobrescreve.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isAllowed(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })

  const body = req.body as ProcessMediaRequest
  const { kind, alt = '', title, description } = body || {}

  if (!kind) return res.status(400).json({ ok: false, error: 'kind ausente' })

  try {
    // Resolve a URL pública do arquivo de origem
    const sourceUrl = await resolveSourceUrl(body)
    if (!sourceUrl) return res.status(400).json({ ok: false, error: 'Não encontrei o arquivo de origem' })

    // Pathname canônico (parte após /media/)
    const sourcePathname = extractPathname(sourceUrl)

    if (kind === 'video') {
      // Vídeo: passa adiante; poster vem em fase futura
      const descriptor: GalleryImage = {
        src: sourceUrl,
        alt,
        title,
        description,
        kind: 'video',
        original: sourceUrl,
      }
      return res.status(200).json({ ok: true, descriptor })
    }

    // Imagem: baixa, gera variantes, sobe cada uma
    const sourceBuffer = await downloadBuffer(sourceUrl)
    const { buffers, lqip, width, height } = await generateImageVariants(sourceBuffer)

    const stem = sourcePathname.replace(/\.[^.]+$/, '')

    const variants: MediaVariants = { webp: {}, avif: {} }
    let largestWebp: string | undefined

    for (const { size, format, buffer } of buffers) {
      const variantPath = `${stem}.${size}.${format}`
      const result = await put(variantPath, buffer, {
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

    const descriptor: GalleryImage = {
      src: largestWebp ?? sourceUrl,
      alt,
      title,
      description,
      kind: 'image',
      variants,
      original: sourceUrl,
      width,
      height,
      lqip,
    }

    return res.status(200).json({ ok: true, descriptor })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) })
  }
}

/** Resolve URL pública a partir de url direta ou pathname */
async function resolveSourceUrl(body: ProcessMediaRequest): Promise<string | null> {
  if (body.url) {
    // Se já é URL pública do CDN, retorna direto
    if (body.url.includes('.public.blob.vercel-storage.com')) return body.url
    // Caso contrário, tenta resolver via head/list
  }
  const pathname = body.pathname || extractPathname(body.url || '')
  if (!pathname) return null
  try {
    const info = await head(pathname)
    if (info?.url) return info.url
  } catch {}
  try {
    const { blobs } = await list({ prefix: pathname, limit: 1 })
    const match = blobs.find((b) => b.pathname === pathname)
    if (match) return match.url
  } catch {}
  return null
}

function extractPathname(url: string): string {
  if (!url) return ''
  // URL pública do Blob: https://X.public.blob.vercel-storage.com/<pathname>
  const m = url.match(/\.blob\.vercel-storage\.com\/(.+?)(?:\?|$)/)
  if (m) return m[1]
  // Proxy legado: /api/media/<dir>/<file>
  const proxyMatch = url.match(/\/api\/media\/(.+?)(?:\?|$)/)
  if (proxyMatch) return `media/${proxyMatch[1]}`
  // Pathname puro
  if (url.startsWith('media/')) return url
  return url.replace(/^\//, '')
}

async function downloadBuffer(url: string): Promise<Buffer> {
  // Para blobs privados, precisa de auth header. Para públicos, qualquer fetch serve.
  const headers: HeadersInit = url.includes('.public.blob.vercel-storage.com')
    ? {}
    : { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}
