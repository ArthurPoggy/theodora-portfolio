import type { NextApiRequest, NextApiResponse } from 'next'
import { getBlobSection } from '@/lib/blob'
import path from 'path'
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  res.setHeader('Cache-Control', 'no-store')

  const blobContent = await getBlobSection('overlays')
  if (blobContent) {
    console.log('[public/overlays] fonte: Vercel Blob')
    return res.status(200).json(JSON.parse(blobContent))
  }

  console.log('[public/overlays] Blob vazio ou erro — usando filesystem')
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'data', 'overlays.json'), 'utf-8')
    return res.status(200).json(JSON.parse(content))
  } catch {
    return res.status(200).json({})
  }
}
