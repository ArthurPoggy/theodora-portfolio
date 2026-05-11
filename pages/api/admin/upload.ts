import type { NextApiRequest, NextApiResponse } from 'next'
import { put } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'
import type { ImageUploadPayload } from '@/types/cms'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'video/mp4']

export const config = { api: { bodyParser: { sizeLimit: '40mb' } } }

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isAuthenticated(req)) return res.status(401).json({ ok: false, error: 'Não autorizado' })

  const { filename, base64, mimeType, targetDir } = req.body as ImageUploadPayload

  if (!filename || !base64 || !mimeType || !targetDir) {
    return res.status(400).json({ ok: false, error: 'Campos obrigatórios ausentes' })
  }

  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ ok: false, error: 'Tipo de arquivo não permitido' })
  }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length > MAX_BYTES) {
    return res.status(400).json({
      ok: false,
      error: `Arquivo muito grande (${Math.round(buffer.length / 1024 / 1024 * 10) / 10} MB). Máximo: 25 MB.`,
    })
  }

  const safeFilename = sanitizeFilename(filename)
  const blobPath = `media/${targetDir}/${safeFilename}`

  try {
    await put(blobPath, buffer, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: mimeType,
    })
    // O publicPath aponta para a rota proxy que serve o blob autenticado
    const publicPath = `/api/media/${targetDir}/${safeFilename}`
    return res.status(200).json({ ok: true, data: { publicPath } })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) })
  }
}
