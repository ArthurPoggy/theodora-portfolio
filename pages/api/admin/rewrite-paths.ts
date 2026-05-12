import type { NextApiRequest, NextApiResponse } from 'next'
import { isAuthenticated } from '@/lib/auth'
import { getBlobSection, putBlobSection } from '@/lib/blob'

const SECTIONS = ['galleries', 'animations', 'about', 'home', 'overlays', 'tracks']

// Aplica um mapping de URL antigas → novas em todas as seções de dados.
// Usado após migrar mídias de private→public para atualizar referências.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })

  const { mapping } = req.body as { mapping: Record<string, string> }
  if (!mapping || typeof mapping !== 'object') {
    return res.status(400).json({ ok: false, error: 'Mapping ausente' })
  }

  const entries = Object.entries(mapping)
  if (entries.length === 0) {
    return res.status(200).json({ ok: true, updated: 0, sections: {} })
  }

  const result: Record<string, { changed: boolean; replacements: number }> = {}

  for (const section of SECTIONS) {
    try {
      const content = await getBlobSection(section)
      if (!content) {
        result[section] = { changed: false, replacements: 0 }
        continue
      }

      let updated = content
      let replacements = 0
      for (const [oldPath, newUrl] of entries) {
        const before = updated.length
        updated = updated.split(oldPath).join(newUrl)
        // Cada substituição muda o tamanho da string proporcionalmente
        if (updated.length !== before) {
          replacements += updated.split(newUrl).length - content.split(newUrl).length
        }
      }

      if (updated !== content) {
        await putBlobSection(section, updated)
        result[section] = { changed: true, replacements }
      } else {
        result[section] = { changed: false, replacements: 0 }
      }
    } catch (e) {
      result[section] = { changed: false, replacements: 0 }
    }
  }

  return res.status(200).json({ ok: true, sections: result })
}
