import { getBlobSection } from './blob'
import path from 'path'
import fs from 'fs'

// Lock em memória da função serverless — evita disparar migrações concorrentes
const migrationLock: Record<string, number> = {}
const MIGRATION_COOLDOWN_MS = 5_000

/** Lê uma seção do CMS: tenta Blob primeiro, cai no filesystem como fallback.
 * Em background, dispara migrate-urls se detectar paths legados — operação
 * leve (só resolve URLs do Blob, sem download/upload de bytes). */
export async function getCmsData<T>(section: string): Promise<T> {
  const blobContent = await getBlobSection(section)
  if (blobContent) {
    maybeTriggerMigration(section, blobContent)
    return JSON.parse(blobContent) as T
  }
  const filePath = path.join(process.cwd(), 'data', `${section}.json`)
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as T
}

/** Detecta paths legados (/api/media/...) e dispara migrate-urls fire-and-forget. */
function maybeTriggerMigration(section: string, content: string): void {
  const internalKey = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (!internalKey) return

  if (!content.includes('/api/media/')) return

  const now = Date.now()
  const last = migrationLock[section] || 0
  if (now - last < MIGRATION_COOLDOWN_MS) return
  migrationLock[section] = now

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || ''
  if (!baseUrl) return

  // Fire-and-forget — não bloqueia a resposta atual
  fetch(`${baseUrl}/api/admin/migrate-urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
  }).catch(() => {})
}
