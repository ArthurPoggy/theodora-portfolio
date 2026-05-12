import type { NextApiRequest, NextApiResponse } from 'next'
import { list, put } from '@vercel/blob'
import { Readable } from 'stream'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

// Cache em memória: pathname → URL final do blob
const urlCache: Record<string, { url: string; isPublic: boolean }> = {}

// Evita disparar promoção simultânea para o mesmo arquivo
const promoting = new Set<string>()

/**
 * Proxy legado pra paths /api/media/<dir>/<file>. Estratégia:
 *
 * - Blob público → 308 redirect para CDN (browser cacheia, próximas requests vão direto)
 * - Blob privado → stream com auth + promoção automática para público em background
 *
 * Após a promoção lazy, na próxima request o blob já é público e vai via redirect.
 * Quando migrate-urls detectar a URL pública no JSON, reescreve o src → ImageKit assume.
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

    // Privado: stream e promove para público em background (migração lazy automática)
    const upstream = await fetch(entry.url)
    if (!upstream.ok || !upstream.body) return res.status(upstream.status).end()

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (contentLength) res.setHeader('Content-Length', contentLength)

    // Clona o stream: um vai para o cliente, outro para a promoção background
    const [streamForClient, streamForUpload] = upstream.body.tee()
    Readable.fromWeb(streamForClient as unknown as import('stream/web').ReadableStream).pipe(res)

    // Fire-and-forget: re-sobe como público para que próximas requests usem CDN diretamente
    if (!promoting.has(blobPath)) {
      promoting.add(blobPath)
      promoteToPublic(blobPath, streamForUpload, contentType).catch(() => {}).finally(() => {
        promoting.delete(blobPath)
      })
    }
  } catch {
    res.status(500).end()
  }
}

async function promoteToPublic(
  pathname: string,
  body: ReadableStream,
  contentType: string,
): Promise<void> {
  await put(pathname, body, {
    access: 'public',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType,
  })
  // Limpa o cache para a próxima request pegar a URL pública
  delete urlCache[pathname]
}
