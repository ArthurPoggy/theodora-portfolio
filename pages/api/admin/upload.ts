import type { NextApiRequest, NextApiResponse } from 'next'
import { isAuthenticated } from '@/lib/auth'
import { getRepoFileSha, putRepoImage } from '@/lib/github'
import type { ImageUploadPayload } from '@/types/cms'

const MAX_BYTES = 750 * 1024 // ~750 KB binário ≈ 1 MB em base64 (limite GitHub)
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'video/mp4']

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

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

  const binarySize = Buffer.from(base64, 'base64').length
  if (binarySize > MAX_BYTES) {
    return res.status(400).json({
      ok: false,
      error: `Arquivo muito grande (${Math.round(binarySize / 1024)} KB). Máximo: 750 KB. Use squoosh.app para comprimir.`,
    })
  }

  const safeFilename = sanitizeFilename(filename)
  const isAudio = mimeType.startsWith('audio/')
  const isVideo = mimeType.startsWith('video/')
  const baseDir = isAudio ? 'public/audio' : isVideo ? 'public/videos' : `public/images/${targetDir}`
  const repoPath = `${baseDir}/${safeFilename}`
  const publicPath = isAudio
    ? `/audio/${safeFilename}`
    : isVideo
    ? `/videos/${safeFilename}`
    : `/images/${targetDir}/${safeFilename}`

  try {
    const existingSha = await getRepoFileSha(repoPath)
    await putRepoImage(repoPath, base64, `cms: upload ${safeFilename}`, existingSha)
    return res.status(200).json({ ok: true, data: { publicPath } })
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) })
  }
}
