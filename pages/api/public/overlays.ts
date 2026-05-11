import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  try {
    const filePath = path.join(process.cwd(), 'data', 'overlays.json')
    const content = fs.readFileSync(filePath, 'utf-8')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json(JSON.parse(content))
  } catch {
    return res.status(200).json({})
  }
}
