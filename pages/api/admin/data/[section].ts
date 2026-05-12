import type { NextApiRequest, NextApiResponse } from 'next'
import { isAuthenticated } from '@/lib/auth'
import { getBlobSection, putBlobSection } from '@/lib/blob'
import { getImageKitJson, putImageKitJson, isImageKitStorageEnabled } from '@/lib/imagekit-storage'
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
    // 1. ImageKit primeiro (storage novo)
    if (isImageKitStorageEnabled()) {
      const ikContent = await getImageKitJson(section)
      if (ikContent) return res.status(200).json({ ok: true, data: JSON.parse(ikContent) })
    }
    // 2. Vercel Blob (legado)
    const blobContent = await getBlobSection(section)
    if (blobContent) return res.status(200).json({ ok: true, data: JSON.parse(blobContent) })
    // 3. Filesystem (estado inicial)
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
    const json = JSON.stringify(data, null, 2)

    // Dual-write durante coexistência: ImageKit é a fonte primária; Blob fica
    // como backup até a migração ser confirmada. Se um dos dois falhar, ainda
    // ok desde que o outro grave.
    const results = await Promise.allSettled([
      isImageKitStorageEnabled() ? putImageKitJson(section, json) : Promise.resolve(),
      putBlobSection(section, json).catch((e) => { console.warn('[cms PUT] blob fallback falhou:', e); throw e }),
    ])

    const ikOk = results[0].status === 'fulfilled'
    const blobOk = results[1].status === 'fulfilled'

    if (!ikOk && !blobOk) {
      const errs = results.map((r) => r.status === 'rejected' ? String(r.reason) : '').filter(Boolean).join(' | ')
      return res.status(500).json({ ok: false, error: errs || 'Falha na gravação' })
    }
    return res.status(200).json({ ok: true, primary: ikOk ? 'imagekit' : 'blob' })
  }

  return res.status(405).end()
}
