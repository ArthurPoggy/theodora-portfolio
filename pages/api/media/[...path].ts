import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { Readable } from 'stream'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

interface CacheEntry {
  url: string
  isPublic: boolean
  cachedAt: number
}

// Cache em memória. URLs de blobs privados são signed e expiram em ~1h.
const urlCache: Record<string, CacheEntry> = {}
const PRIVATE_CACHE_TTL_MS = 50 * 60 * 1000 // 50 min (margem antes de expirar)

/**
 * Proxy para paths /api/media/<dir>/<file>.
 *
 * - Blob público  → 308 redirect para CDN (browser cacheia, futuras requests vão direto)
 * - Blob privado  → stream autenticado
 *
 * Blobs privados são migrados para públicos automaticamente quando o admin
 * roda o botão "Reescrever paths" (migrate-urls). Após migração, o CMS
 * passa a referenciar a URL pública do CDN e o proxy deixa de ser necessário.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const segments = req.query.path
  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).end()
  }

  const blobPath = `media/${segments.join('/')}`

  try {
    const now = Date.now()
    let entry = urlCache[blobPath]

    // Signed URLs de blobs privados expiram — recarrega antes do vencimento
    const needsRefresh = !entry || (!entry.isPublic && now - entry.cachedAt > PRIVATE_CACHE_TTL_MS)

    if (needsRefresh) {
      const { blobs } = await list({ prefix: blobPath, limit: 1 })
      const blob = blobs.find((b) => b.pathname === blobPath)
      if (!blob) return res.status(404).end()
      entry = {
        url: blob.url,
        isPublic: blob.url.includes('.public.blob.vercel-storage.com'),
        cachedAt: now,
      }
      urlCache[blobPath] = entry
    }

    // Público: redirect imutável — browser e CDN cacheia para sempre
    if (entry.isPublic) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Location', entry.url)
      return res.status(308).end()
    }

    // Privado: fetch autenticado + stream para o cliente
    const upstream = await fetch(entry.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })

    if (!upstream.ok || !upstream.body) {
      // URL pode ter expirado — limpa o cache e tenta uma vez
      delete urlCache[blobPath]
      return res.status(upstream.status || 500).end()
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    Readable.fromWeb(upstream.body as unknown as import('stream/web').ReadableStream).pipe(res)
  } catch {
    res.status(500).end()
  }
}
