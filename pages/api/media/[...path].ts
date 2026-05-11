import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'

// Serve arquivos de mídia armazenados no Vercel Blob (store privado).
// A URL pública do site usa /api/media/<targetDir>/<filename>.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const segments = req.query.path
  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).end()
  }

  const blobPath = `media/${segments.join('/')}`

  try {
    const { blobs } = await list({ prefix: blobPath, limit: 1 })
    const blob = blobs.find((b) => b.pathname === blobPath)
    if (!blob) return res.status(404).end()

    const upstream = await fetch(blob.url, {
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
