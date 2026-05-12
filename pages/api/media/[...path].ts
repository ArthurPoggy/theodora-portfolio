import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { Readable } from 'stream'

export const config = {
  api: { responseLimit: false },
}

// Cache em memória: pathname → blob URL (sobrevive entre invocações da mesma instância)
const urlCache: Record<string, string> = {}

// Proxy legado para arquivos privados antigos. Novos uploads usam
// access:'public' e CDN direto. Após migração via /api/admin/migrate-media,
// este proxy só serve fallback de paths não migrados.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const segments = req.query.path
  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).end()
  }

  const blobPath = `media/${segments.join('/')}`

  try {
    let blobUrl = urlCache[blobPath]

    if (!blobUrl) {
      const { blobs } = await list({ prefix: blobPath, limit: 1 })
      const blob = blobs.find((b) => b.pathname === blobPath)
      if (!blob) return res.status(404).end()
      blobUrl = blob.url
      urlCache[blobPath] = blobUrl
    }

    const upstream = await fetch(blobUrl, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })
    if (!upstream.ok || !upstream.body) return res.status(upstream.status).end()

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Streaming em vez de bufferizar em memória (importante para arquivos grandes)
    Readable.fromWeb(upstream.body as unknown as import('stream/web').ReadableStream).pipe(res)
  } catch {
    res.status(500).end()
  }
}
