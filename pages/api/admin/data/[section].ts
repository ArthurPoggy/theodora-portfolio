import type { NextApiRequest, NextApiResponse } from 'next'
import { isAuthenticated } from '@/lib/auth'
import { getBlobSection, putBlobSection } from '@/lib/blob'
import path from 'path'
import fs from 'fs'

const VALID_SECTIONS = ['galleries', 'animations', 'about', 'testimonials', 'tracks', 'home', 'social', 'overlays']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { section } = req.query as { section: string }

  if (!VALID_SECTIONS.includes(section)) {
    return res.status(400).json({ ok: false, error: 'Seção inválida' })
  }

  if (!isAuthenticated(req)) {
    return res.status(401).json({ ok: false, error: 'Não autorizado' })
  }

  if (req.method === 'GET') {
    // Tenta Blob primeiro; fallback para filesystem local (antes da primeira gravação)
    const blobContent = await getBlobSection(section)
    if (blobContent) {
      return res.status(200).json({ ok: true, data: JSON.parse(blobContent) })
    }
    try {
      const localPath = path.join(process.cwd(), 'data', `${section}.json`)
      const content = fs.readFileSync(localPath, 'utf-8')
      return res.status(200).json({ ok: true, data: JSON.parse(content) })
    } catch {
      return res.status(500).json({ ok: false, error: 'Dados não encontrados' })
    }
  }

  if (req.method === 'PUT') {
    const { data } = req.body as { data: unknown }
    if (data === undefined || data === null) {
      return res.status(400).json({ ok: false, error: 'Dados ausentes' })
    }
    try {
      await putBlobSection(section, JSON.stringify(data, null, 2))
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ ok: false, error: String(err) })
    }
  }

  return res.status(405).end()
}
