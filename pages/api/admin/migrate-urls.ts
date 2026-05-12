import type { NextApiRequest, NextApiResponse } from 'next'
import { list } from '@vercel/blob'
import { getBlobSection, putBlobSection } from '@/lib/blob'
import { isAuthenticated } from '@/lib/auth'

export const config = {
  api: { responseLimit: false },
  maxDuration: 60,
}

const SECTIONS = ['galleries', 'animations', 'about', 'home', 'overlays']

function isAllowed(req: NextApiRequest): boolean {
  const key = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (key && req.headers['x-internal-key'] === key) return true
  return isAuthenticated(req)
}

/**
 * Reescreve todos os paths legados (/api/media/...) e descriptors antigos
 * (com `variants`/`lqip` deixados de uma versão anterior) nos JSONs do CMS
 * para usarem APENAS URLs públicas diretas do Vercel Blob.
 *
 * Não baixa/upa bytes — apenas resolve cada path para a URL pública do CDN
 * via list() e reescreve o JSON. Operação rápida, idempotente.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAllowed(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  const cache: Record<string, string | null> = {}

  async function resolveLegacyPath(legacyPath: string): Promise<string | null> {
    // Aceita: /api/media/foo/bar.jpg  ou  media/foo/bar.jpg
    let pathname = legacyPath
    const proxyMatch = pathname.match(/\/api\/media\/(.+?)(?:\?|$)/)
    if (proxyMatch) pathname = `media/${proxyMatch[1]}`
    if (cache[pathname] !== undefined) return cache[pathname]
    try {
      const { blobs } = await list({ prefix: pathname, limit: 1 })
      const match = blobs.find((b) => b.pathname === pathname)
      const url = match?.url ?? null
      cache[pathname] = url
      return url
    } catch {
      cache[pathname] = null
      return null
    }
  }

  function isLegacy(src: unknown): boolean {
    if (typeof src !== 'string') return false
    if (src.startsWith('/api/media/')) return true
    return false
  }

  async function rewrite(node: unknown): Promise<unknown> {
    if (!node) return node
    if (Array.isArray(node)) {
      const out = []
      for (const item of node) out.push(await rewrite(item))
      return out
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(o)) {
        if (k === 'src' && isLegacy(v)) {
          const resolved = await resolveLegacyPath(v as string)
          out[k] = resolved ?? v
        } else if ((k === 'variants' || k === 'lqip') && o.src) {
          // Limpa descriptors antigos com variants/lqip — não precisa mais
          continue
        } else {
          out[k] = await rewrite(v)
        }
      }
      return out
    }
    return node
  }

  const result: Record<string, { changed: boolean; replacements: number }> = {}
  let totalReplacements = 0

  for (const section of SECTIONS) {
    try {
      const content = await getBlobSection(section)
      if (!content) {
        result[section] = { changed: false, replacements: 0 }
        continue
      }
      const before = content
      const data = JSON.parse(before)
      const rewritten = await rewrite(data)
      const after = JSON.stringify(rewritten, null, 2)
      if (after !== before) {
        const replacements = (before.match(/\/api\/media\//g) || []).length
          - (after.match(/\/api\/media\//g) || []).length
        await putBlobSection(section, after)
        result[section] = { changed: true, replacements }
        totalReplacements += replacements
      } else {
        result[section] = { changed: false, replacements: 0 }
      }
    } catch (e) {
      result[section] = { changed: false, replacements: 0 }
    }
  }

  return res.status(200).json({ ok: true, sections: result, totalReplacements })
}
