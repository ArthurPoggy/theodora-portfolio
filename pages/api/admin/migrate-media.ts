import type { NextApiRequest, NextApiResponse } from 'next'
import { list, put } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'

// Re-uploads private media blobs as public so they're served directly from
// Vercel CDN (no proxy needed). Supports batching via cursor to avoid
// timeout on plans with curtos limites de execução.
export const config = {
  api: { responseLimit: false },
  maxDuration: 300,
}

interface MigrateRequestBody {
  cursor?: string
  limit?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })

  const { cursor, limit = 5 } = (req.body || {}) as MigrateRequestBody

  try {
    const result = await list({ prefix: 'media/', limit, cursor })
    const mapping: Record<string, string> = {}
    const errors: string[] = []

    for (const blob of result.blobs) {
      try {
        // Se já é uma URL pública (public.blob.vercel-storage.com sem token),
        // pula — já está migrado.
        const isPublic = blob.url.includes('.public.blob.vercel-storage.com')
        if (isPublic) {
          mapping[`/api/${blob.pathname}`] = blob.url
          continue
        }

        const upstream = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
        })
        if (!upstream.ok) {
          errors.push(`${blob.pathname}: download falhou (${upstream.status})`)
          continue
        }

        const buffer = Buffer.from(await upstream.arrayBuffer())
        const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

        const putResult = await put(blob.pathname, buffer, {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType,
        })

        mapping[`/api/${blob.pathname}`] = putResult.url
      } catch (e) {
        errors.push(`${blob.pathname}: ${String(e)}`)
      }
    }

    return res.status(200).json({
      ok: true,
      migrated: Object.keys(mapping).length,
      batchSize: result.blobs.length,
      mapping,
      errors,
      cursor: result.cursor,
      hasMore: result.hasMore,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) })
  }
}
