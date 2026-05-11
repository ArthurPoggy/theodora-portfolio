import { put, list } from '@vercel/blob'

const PREFIX = 'cms/'

/** Lê um JSON do Blob (store privado — usa token no header). */
export async function getBlobSection(section: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: `${PREFIX}${section}.json`, limit: 1 })
    const blob = blobs.find((b) => b.pathname === `${PREFIX}${section}.json`)
    if (!blob) return null
    const res = await fetch(blob.url, {
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

/** Grava um JSON no Blob (sobrescreve se já existir). */
export async function putBlobSection(section: string, content: string): Promise<void> {
  await put(`${PREFIX}${section}.json`, content, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  })
}
