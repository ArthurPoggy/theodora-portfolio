import type { NextApiRequest, NextApiResponse } from 'next'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isAuthenticated } from '@/lib/auth'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/svg+xml', 'video/mp4',
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Não autorizado' })

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req as unknown as Request,
      onBeforeGenerateToken: async () => ({
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        allowedContentTypes: ALLOWED_TYPES,
        maximumSizeInBytes: 100 * 1024 * 1024, // 100 MB
      }),
      onUploadCompleted: async () => {},
    })
    return res.status(200).json(jsonResponse)
  } catch (err) {
    return res.status(400).json({ error: String(err) })
  }
}
