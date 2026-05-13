import type { NextApiRequest, NextApiResponse } from 'next'
import { getBlobSection, putBlobSection } from '@/lib/blob'

const COOKIE_NAME = 'vc_seen'
const COOKIE_MAX_AGE = 60 * 60 // 1h em segundos

function hasSeenCookie(req: NextApiRequest): boolean {
  const raw = req.headers.cookie || ''
  return raw.split(';').some((c) => c.trim().startsWith(`${COOKIE_NAME}=`))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  let count = 0
  const content = await getBlobSection('visits')
  if (content) {
    try { count = (JSON.parse(content) as { count: number }).count ?? 0 } catch {}
  }

  if (req.method === 'POST' && !hasSeenCookie(req)) {
    count = count + 1
    try {
      await putBlobSection('visits', JSON.stringify({ count }))
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=1; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`)
    } catch {
      // Falha silenciosa: contagem não cresce mas a UI ainda recebe número
    }
  }

  return res.status(200).json({ value: count })
}
