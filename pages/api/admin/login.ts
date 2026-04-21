import type { NextApiRequest, NextApiResponse } from 'next'
import { validatePassword, setSessionCookie } from '@/lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body as { password?: string }
  if (!password || !validatePassword(password)) {
    return res.status(401).json({ ok: false, error: 'Senha incorreta' })
  }

  setSessionCookie(res)
  return res.status(200).json({ ok: true })
}
