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
 * Reescreve o CMS para remover referências inacessíveis pelo browser:
 *
 * 1. Paths legados /api/media/...  → tenta resolver para URL pública CDN
 *    (só reescreve se o blob for PÚBLICO; ignora privados)
 *
 * 2. URLs privadas .private.blob.vercel-storage.com/...  → converte de volta
 *    para o path do proxy /api/media/... (acessível via servidor)
 *
 * Também limpa campos antigos variants/lqip. Operação idempotente.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAllowed(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  // Cache pathname → URL pública (null se privado ou não encontrado)
  const resolveCache: Record<string, string | null> = {}

  /** Resolve /api/media/... path → URL pública do CDN (null se blob privado) */
  async function resolveLegacyPath(legacyPath: string): Promise<string | null> {
    let pathname = legacyPath
    const proxyMatch = pathname.match(/\/api\/media\/(.+?)(?:\?|$)/)
    if (proxyMatch) pathname = `media/${proxyMatch[1]}`
    if (resolveCache[pathname] !== undefined) return resolveCache[pathname]
    try {
      const { blobs } = await list({ prefix: pathname, limit: 1 })
      const blob = blobs.find((b) => b.pathname === pathname)
      if (!blob) { resolveCache[pathname] = null; return null }
      // Só usa se for URL pública (CDN acessível sem auth)
      const isPublic = blob.url.includes('.public.blob.vercel-storage.com')
      const url = isPublic ? blob.url : null
      resolveCache[pathname] = url
      return url
    } catch {
      resolveCache[pathname] = null
      return null
    }
  }

  /** /api/media/ path ou URL que precisa ser atualizada */
  function isLegacyProxyPath(src: unknown): boolean {
    return typeof src === 'string' && src.startsWith('/api/media/')
  }

  /** URL privada do Vercel Blob salva erroneamente no CMS */
  function isPrivateBlobUrl(src: unknown): boolean {
    return typeof src === 'string' && src.includes('.private.blob.vercel-storage.com')
  }

  /** Converte URL privada de volta para path do proxy /api/media/... */
  function privateBlobToProxy(src: string): string {
    const match = src.match(/\.private\.blob\.vercel-storage\.com\/(media\/.+?)(?:\?|$)/)
    if (!match) return src
    const pathname = match[1] // "media/gifs/star-1-.gif"
    return `/api/media/${pathname.slice('media/'.length)}` // "/api/media/gifs/star-1-.gif"
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
        if (k === 'src') {
          if (isLegacyProxyPath(v)) {
            // Tenta promover para URL pública; mantém proxy path se privado
            const resolved = await resolveLegacyPath(v as string)
            out[k] = resolved ?? v
          } else if (isPrivateBlobUrl(v)) {
            // Reverte URL privada para proxy path (corrige migrate-urls anterior)
            out[k] = privateBlobToProxy(v as string)
          } else {
            out[k] = v
          }
        } else if ((k === 'variants' || k === 'lqip') && o.src) {
          continue // Remove campos antigos
        } else {
          out[k] = await rewrite(v)
        }
      }
      return out
    }
    return node
  }

  const result: Record<string, { changed: boolean; replacements: number; privateFixes: number }> = {}
  let totalReplacements = 0
  let totalPrivateFixes = 0

  for (const section of SECTIONS) {
    try {
      const content = await getBlobSection(section)
      if (!content) {
        result[section] = { changed: false, replacements: 0, privateFixes: 0 }
        continue
      }
      const before = content
      const data = JSON.parse(before)
      const rewritten = await rewrite(data)
      const after = JSON.stringify(rewritten, null, 2)

      if (after !== before) {
        const replacements = (before.match(/\/api\/media\//g) || []).length
          - (after.match(/\/api\/media\//g) || []).length
        const privateFixes = (before.match(/\.private\.blob\.vercel-storage\.com/g) || []).length
          - (after.match(/\.private\.blob\.vercel-storage\.com/g) || []).length
        await putBlobSection(section, after)
        result[section] = { changed: true, replacements: Math.max(0, replacements), privateFixes: Math.max(0, privateFixes) }
        totalReplacements += Math.max(0, replacements)
        totalPrivateFixes += Math.max(0, privateFixes)
      } else {
        result[section] = { changed: false, replacements: 0, privateFixes: 0 }
      }
    } catch {
      result[section] = { changed: false, replacements: 0, privateFixes: 0 }
    }
  }

  return res.status(200).json({ ok: true, sections: result, totalReplacements, totalPrivateFixes })
}
