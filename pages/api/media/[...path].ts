import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'

// Cache em memória: pathname → blob URL (só para blobs privados antigos)
const urlCache: Record<string, string> = {}

// Serve arquivos de mídia privados legados armazenados no Vercel Blob.
// Novos uploads usam access:'public' e CDN direto — este proxy só existe
// para compatibilidade com arquivos antigos que ainda usam /api/media/...
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
    if (!upstream.ok) return res.status(upstream.status).end()

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    const arrayBuffer = await upstream.arrayBuffer()
    res.send(Buffer.from(arrayBuffer))
  } catch {
    res.status(500).end()
  }
}
