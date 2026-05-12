import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { isAuthenticated } from '@/lib/auth'

/**
 * Endpoint que assina uma upload request pro ImageKit.
 *
 * Conforme docs (https://imagekit.io/docs/api-reference/upload-file/upload-file):
 *   signature = HMAC-SHA1(token + expire, privateKey)  // hex lowercase
 *   expire    = unix timestamp em segundos, < 1h no futuro
 *   token     = UUID único por request
 *
 * O client manda esses 3 + publicKey no FormData do POST pro
 * upload.imagekit.io/api/v1/files/upload.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'Não autorizado' })

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !publicKey || !urlEndpoint) {
    return res.status(500).json({
      error: 'ImageKit não configurado (faltam IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY ou NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)',
    })
  }

  const token = crypto.randomUUID()
  const expire = Math.floor(Date.now() / 1000) + 30 * 60 // 30 min
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + String(expire))
    .digest('hex')

  return res.status(200).json({
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint,
  })
}
