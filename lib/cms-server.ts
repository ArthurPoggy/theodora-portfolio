import { getBlobSection } from './blob'
import path from 'path'
import fs from 'fs'

/** Lê uma seção do CMS: tenta Blob primeiro, cai no filesystem como fallback. */
export async function getCmsData<T>(section: string): Promise<T> {
  const blobContent = await getBlobSection(section)
  if (blobContent) return JSON.parse(blobContent) as T
  const filePath = path.join(process.cwd(), 'data', `${section}.json`)
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as T
}
