import crypto from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'

const COOKIE_NAME = 'cms_session'
const MAX_AGE = 60 * 60 * 24 // 24 horas em segundos

function todayToken(): string {
  const secret = process.env.CMS_SECRET || 'fallback-secret'
  const password = process.env.CMS_PASSWORD || ''
  const day = new Date().toISOString().slice(0, 10)
  return crypto.createHmac('sha256', secret).update(password + day).digest('hex')
}

export function isAuthenticated(req: NextApiRequest): boolean {
  const raw = req.headers.cookie || ''
  const cookies = Object.fromEntries(
    raw.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    }),
  )
  const session = cookies[COOKIE_NAME]
  if (!session) return false
  return crypto.timingSafeEqual(Buffer.from(session), Buffer.from(todayToken()))
}

export function setSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${todayToken()}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`,
  )
}

export function clearSessionCookie(res: NextApiResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
  )
}

export function validatePassword(input: string): boolean {
  const expected = process.env.CMS_PASSWORD || ''
  if (input.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected))
}
