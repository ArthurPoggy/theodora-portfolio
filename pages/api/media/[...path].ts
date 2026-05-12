import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { Readable } from 'stream'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

// Cache em memória: pathname → URL final do blob
const urlCache: Record<string, { url: string; isPublic: boolean }> = {}

/**
 * Proxy legado pra paths /api/media/<dir>/<file>. Esses paths vêm de uploads
 * antigos (alguns privados, alguns públicos). Estratégia:
 *
 * - Cache da URL do blob em memória pra evitar list() em cada request
 * - Se URL é pública → 308 redirect (browser cacheia, próximas requests vão direto pro CDN)
 * - Se URL é privada → fetch autenticado + stream
 *
 * Idempotente. A migração definitiva pra public + variantes acontece em
 * /api/admin/auto-migrate (em background).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const segments = req.query.path
  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).end()
  }

  const blobPath = `media/${segments.join('/')}`

  try {
    let entry = urlCache[blobPath]
    if (!entry) {
      const { blobs } = await list({ prefix: blobPath, limit: 1 })
      const blob = blobs.find((b) => b.pathname === blobPath)
      if (!blob) return res.status(404).end()
      entry = {
        url: blob.url,
        isPublic: blob.url.includes('.public.blob.vercel-storage.com'),
      }
      urlCache[blobPath] = entry
    }

    // Público: redirect — browser cacheia o 308 e vai direto pro CDN nas próximas
    if (entry.isPublic) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Location', entry.url)
      return res.status(308).end()
    }

    // Privado: stream da resposta
    const upstream = await fetch(entry.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })
    if (!upstream.ok || !upstream.body) return res.status(upstream.status).end()

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    Readable.fromWeb(upstream.body as unknown as import('stream/web').ReadableStream).pipe(res)
  } catch {
    res.status(500).end()
  }
}
