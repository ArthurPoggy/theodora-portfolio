import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'
import { getBlobSection, putBlobSection } from '@/lib/blob'
import { uploadToImageKit, putImageKitJson, isImageKitStorageEnabled } from '@/lib/imagekit-storage'

export const config = {
  api: { responseLimit: false, bodyParser: { sizeLimit: '1mb' } },
  maxDuration: 300, // 5 min — média de migração pode levar tempo
}

const CMS_SECTIONS = ['galleries', 'animations', 'about', 'home', 'overlays', 'testimonials', 'tracks', 'social']

function isAllowed(req: NextApiRequest): boolean {
  const key = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (key && req.headers['x-internal-key'] === key) return true
  return isAuthenticated(req)
}

/**
 * Copia mídias do Vercel Blob → ImageKit Media Library e reescreve todas as
 * referências no CMS.
 *
 * Idempotente: re-upload sobrescreve a mesma URL no ImageKit; URLs já
 * convertidas não são tocadas.
 *
 * GET  → preview (lista o que seria feito, sem alterar nada)
 * POST → executa a migração
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAllowed(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })
  if (!isImageKitStorageEnabled()) {
    return res.status(500).json({ ok: false, error: 'ImageKit não configurado (faltam IMAGEKIT_PRIVATE_KEY ou NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)' })
  }

  const dryRun = req.method === 'GET'
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  const ikEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!.replace(/\/$/, '')

  // ─── 1. Lista todas as mídias no Blob (folder media/) ─────────────────────
  const blobs: Array<{ pathname: string; url: string; downloadUrl: string }> = []
  let cursor: string | undefined
  do {
    const page = await list({ prefix: 'media/', limit: 1000, cursor })
    blobs.push(...page.blobs)
    cursor = page.cursor
  } while (cursor)

  // Mapa Blob-URL → ImageKit-URL (para reescrita no CMS)
  const urlMap: Record<string, string> = {}
  const uploadResults: Array<{ pathname: string; status: 'ok' | 'error' | 'dry-run'; error?: string }> = []

  // ─── 2. Para cada blob, baixa e re-uploada no ImageKit ────────────────────
  if (!dryRun) {
    for (const blob of blobs) {
      try {
        // Baixa via downloadUrl (assinada, funciona pra privados também)
        const r = await fetch(blob.downloadUrl)
        if (!r.ok) throw new Error(`download ${r.status}`)
        const buffer = Buffer.from(await r.arrayBuffer())
        const contentType = r.headers.get('content-type') || 'application/octet-stream'

        // blob.pathname = "media/3d/obra.webp" → folder="media/3d", fileName="obra.webp"
        const parts = blob.pathname.split('/')
        const fileName = parts.pop()!
        const folder = parts.join('/')

        const { url } = await uploadToImageKit({
          buffer,
          fileName,
          folder,
          contentType,
          overwrite: true,
        })

        // Mapeia tanto a URL pública quanto a path do proxy legado
        urlMap[blob.url] = url
        urlMap[`/api/media/${blob.pathname.replace(/^media\//, '')}`] = url
        uploadResults.push({ pathname: blob.pathname, status: 'ok' })
      } catch (e) {
        uploadResults.push({ pathname: blob.pathname, status: 'error', error: String(e) })
      }
    }
  } else {
    // Dry run: só popula o mapa hipotético
    for (const blob of blobs) {
      const ikUrl = `${ikEndpoint}/${blob.pathname}`
      urlMap[blob.url] = ikUrl
      urlMap[`/api/media/${blob.pathname.replace(/^media\//, '')}`] = ikUrl
      uploadResults.push({ pathname: blob.pathname, status: 'dry-run' })
    }
  }

  // ─── 3. Reescreve URLs em todas as seções do CMS ──────────────────────────
  const sectionResults: Record<string, { changed: boolean; replacements: number; error?: string }> = {}
  let totalReplacements = 0

  for (const section of CMS_SECTIONS) {
    try {
      const content = await getBlobSection(section)
      if (!content) {
        sectionResults[section] = { changed: false, replacements: 0 }
        continue
      }

      let rewritten = content
      let replacements = 0
      for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
        const matches = rewritten.match(new RegExp(escapeRegex(oldUrl), 'g'))
        if (!matches) continue
        replacements += matches.length
        rewritten = rewritten.split(oldUrl).join(newUrl)
      }

      if (rewritten !== content && !dryRun) {
        // Grava em ambos (mantém Blob sincronizado durante coexistência)
        await Promise.allSettled([
          putImageKitJson(section, rewritten),
          putBlobSection(section, rewritten),
        ])
      }
      sectionResults[section] = { changed: rewritten !== content, replacements }
      totalReplacements += replacements
    } catch (e) {
      sectionResults[section] = { changed: false, replacements: 0, error: String(e) }
    }
  }

  return res.status(200).json({
    ok: true,
    dryRun,
    blobsFound: blobs.length,
    uploads: uploadResults,
    sections: sectionResults,
    totalReplacements,
  })
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
