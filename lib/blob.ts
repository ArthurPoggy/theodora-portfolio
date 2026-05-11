import { put, list } from '@vercel/blob'

const PREFIX = 'cms/'

/** Lê um JSON do Blob. Retorna null se não existir. */
export async function getBlobSection(section: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}${section}.json`, limit: 1 })
    const blob = blobs.find((b) => b.pathname === `${PREFIX}${section}.json`)
    if (!blob) return null
    // Adiciona timestamp para ignorar cache CDN e pegar a versão mais recente
    const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

/** Grava um JSON no Blob (sobrescreve se já existir). */
export async function putBlobSection(section: string, content: string): Promise<void> {
  await put(`${PREFIX}${section}.json`, content, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  })
}
