import type { NextApiRequest, NextApiResponse } from 'next'
import { list, put } from '@vercel/blob'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

// Cache em memória: pathname → URL pública do CDN.
// Persiste enquanto a instância serverless estiver quente.
const publicUrlCache: Record<string, string> = {}

// Proxy auto-migrador. Na primeira request a um arquivo legado privado:
// promove para access:'public' e redireciona pra URL pública.
// Requests seguintes vão direto do redirect cacheado pelo browser/Vercel.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const segments = req.query.path
  if (!segments || !Array.isArray(segments) || segments.length < 2) {
    return res.status(400).end()
  }

  const blobPath = `media/${segments.join('/')}`

  // Hit no cache: redirect imediato (sem nem listar)
  const cached = publicUrlCache[blobPath]
  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.redirect(308, cached)
  }

  try {
    const { blobs } = await list({ prefix: blobPath, limit: 1 })
    const blob = blobs.find((b) => b.pathname === blobPath)
    if (!blob) return res.status(404).end()

    // Já é público — cacheia e redireciona
    if (blob.url.includes('.public.blob.vercel-storage.com')) {
      publicUrlCache[blobPath] = blob.url
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      return res.redirect(308, blob.url)
    }

    // É privado — promove para público on-the-fly
    const upstream = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    })
    if (!upstream.ok) return res.status(upstream.status).end()

    const buffer = Buffer.from(await upstream.arrayBuffer())
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

    const result = await put(blob.pathname, buffer, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    })

    publicUrlCache[blobPath] = result.url
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.redirect(308, result.url)
  } catch {
    return res.status(500).end()
  }
}
