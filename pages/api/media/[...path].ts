import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { Readable } from 'stream'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

interface CacheEntry {
  url: string          // URL pública do CDN (apenas para blobs públicos)
  downloadUrl: string  // URL assinada (funciona sem auth, expira em ~1h)
  isPublic: boolean
  cachedAt: number
}

const urlCache: Record<string, CacheEntry> = {}
const PRIVATE_CACHE_TTL_MS = 50 * 60 * 1000 // 50 min (margem antes de a signed URL expirar)

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

    // Blobs privados usam signed URLs (downloadUrl) que expiram em ~1h — recarrega antes
    const needsRefresh = !entry || (!entry.isPublic && now - entry.cachedAt > PRIVATE_CACHE_TTL_MS)

    if (needsRefresh) {
      const { blobs } = await list({ prefix: blobPath, limit: 1 })
      const blob = blobs.find((b) => b.pathname === blobPath)
      if (!blob) return res.status(404).end()
      entry = {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        isPublic: blob.url.includes('.public.blob.vercel-storage.com'),
        cachedAt: now,
      }
      urlCache[blobPath] = entry
    }

    // Público: redirect 308 permanente para CDN
    if (entry.isPublic) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      res.setHeader('Location', entry.url)
      return res.status(308).end()
    }

    // Privado: busca via downloadUrl (assinada, não precisa de Authorization header)
    // e serve inline (override do Content-Disposition: attachment que o Blob coloca)
    const upstream = await fetch(entry.downloadUrl)
    if (!upstream.ok || !upstream.body) {
      delete urlCache[blobPath] // limpa cache se a signed URL expirou
      return res.status(upstream.status || 500).end()
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    Readable.fromWeb(upstream.body as unknown as import('stream/web').ReadableStream).pipe(res)
  } catch {
    res.status(500).end()
  }
}
