import type { NextApiRequest, NextApiResponse } from 'next'
import { getBlobSection } from '@/lib/blob'
import path from 'path'
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')

  const blobContent = await getBlobSection('overlays')
  if (blobContent) {
    return res.status(200).json(JSON.parse(blobContent))
  }

  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'data', 'overlays.json'), 'utf-8')
    return res.status(200).json(JSON.parse(content))
  } catch {
    return res.status(200).json({})
  }
}
