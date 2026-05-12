/** Helper para cachear respostas de API em sessionStorage com TTL. */

const TTL_MS = 5 * 60 * 1000 // 5 minutos

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export function getSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (!entry || entry.expiresAt < Date.now()) {
      sessionStorage.removeItem(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

export function setSessionCache<T>(key: string, data: T, ttlMs: number = TTL_MS): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + ttlMs }))
  } catch {}
}

export async function fetchWithCache<T>(key: string, url: string, ttlMs: number = TTL_MS): Promise<T | null> {
  const cached = getSessionCache<T>(key)
  if (cached !== null) return cached
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as T
    setSessionCache(key, data, ttlMs)
    return data
  } catch {
    return null
  }
}
