import { getBlobSection } from './blob'
import path from 'path'
import fs from 'fs'

// Memória da função serverless: evita disparar 100 migrações concorrentes
const migrationLock: Record<string, number> = {}
const MIGRATION_COOLDOWN_MS = 15_000

/** Lê uma seção do CMS: tenta Blob primeiro, cai no filesystem como fallback.
 * Em background, dispara auto-migração se detectar paths legados (não bloqueia
 * a resposta atual). */
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

/** Detecta heuristicamente paths legados e dispara auto-migrate fire-and-forget. */
function maybeTriggerMigration(section: string, content: string): void {
  const internalKey = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (!internalKey) return

  const hasLegacyProxy = content.includes('/api/media/')
  const hasMissingVariants = /"src"\s*:\s*"https?:\/\/[^"]*\.blob\.vercel-storage\.com/.test(content)
    && !content.includes('"variants"')
  if (!hasLegacyProxy && !hasMissingVariants) return

  const now = Date.now()
  const last = migrationLock[section] || 0
  if (now - last < MIGRATION_COOLDOWN_MS) return
  migrationLock[section] = now

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || ''
  if (!baseUrl) return

  // Fire-and-forget — não bloqueia a resposta atual
  fetch(`${baseUrl}/api/admin/auto-migrate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': internalKey,
    },
    body: JSON.stringify({ batch: 3 }),
  }).catch(() => {})
}
