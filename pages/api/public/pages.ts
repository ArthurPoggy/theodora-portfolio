import type { NextApiRequest, NextApiResponse } from 'next'
import { getCmsData } from '@/lib/cms-server'
import type { PagesData } from '@/types/cms'

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const pages = await getCmsData<PagesData>('pages')
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=300')
    return res.status(200).json(Array.isArray(pages) ? pages : [])
  } catch {
    return res.status(200).json([])
  }
}
