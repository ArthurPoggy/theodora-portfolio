import { getBlobSection } from './blob'
import { getImageKitJson, isImageKitStorageEnabled } from './imagekit-storage'
import path from 'path'
import fs from 'fs'

// Lock em memória da função serverless — evita disparar migrações concorrentes
const migrationLock: Record<string, number> = {}
const MIGRATION_COOLDOWN_MS = 5_000

/**
 * Lê uma seção do CMS com triplo fallback durante a coexistência ImageKit↔Blob:
 *   1. ImageKit Media Library (novo storage)
 *   2. Vercel Blob (storage legado, mantido até migração completa)
 *   3. Filesystem (`data/<section>.json`) — fallback final, antes da primeira gravação
 *
 * Quando o conteúdo vem do Blob com paths legados (/api/media/ ou URLs privadas),
 * dispara migrate-urls fire-and-forget.
 */
export async function getCmsData<T>(section: string): Promise<T> {
  // 1. ImageKit primeiro (storage novo)
  if (isImageKitStorageEnabled()) {
    const ikContent = await getImageKitJson(section)
    if (ikContent) return JSON.parse(ikContent) as T
  }

  // 2. Vercel Blob (legado, fallback durante coexistência)
  const blobContent = await getBlobSection(section)
  if (blobContent) {
    maybeTriggerMigration(section, blobContent)
    return JSON.parse(blobContent) as T
  }

  // 3. Filesystem (estado inicial)
  const filePath = path.join(process.cwd(), 'data', `${section}.json`)
  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content) as T
}

/** Detecta paths legados (/api/media/...) e dispara migrate-urls fire-and-forget. */
function maybeTriggerMigration(section: string, content: string): void {
  const internalKey = process.env.INTERNAL_API_KEY || process.env.BLOB_READ_WRITE_TOKEN
  if (!internalKey) return

  if (!content.includes('/api/media/') && !content.includes('.private.blob.vercel-storage.com')) return

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
