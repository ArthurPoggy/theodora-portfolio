/**
 * Helper para construir URLs do ImageKit usando o modo Full-URL.
 *
 * Não requer configuração de "External Storage" no painel ImageKit.
 * Basta definir a variável de ambiente com o endpoint da sua conta:
 *
 *   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/SEU_ID
 *
 * O URL endpoint fica visível no painel em:
 *   ImageKit Dashboard → URL Endpoints → Default
 *
 * Sem env var configurada, o helper retorna a URL original (graceful fallback).
 */

const IK_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

export interface ImageKitOpts {
  w?: number              // largura alvo em px
  q?: number              // qualidade 1-100 (default 80)
  blur?: number           // blur strength 1-100 (para LQIP)
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png' | 'mp4'
}

/**
 * Converte URLs problemáticas de mídia para formas acessíveis pelo browser:
 *   - URLs privadas do Vercel Blob → path do proxy /api/media/...
 *
 * Chame isso antes de usar qualquer src em <img>, next/image ou buildImageKitUrl.
 */
export function normalizeMediaSrc(src: string): string {
  if (!src) return src
  const privateMatch = src.match(/\.private\.blob\.vercel-storage\.com\/(media\/.+?)(?:\?|$)/)
  if (privateMatch) {
    // "media/gifs/star-1-.gif" → "/api/media/gifs/star-1-.gif"
    return `/api/media/${privateMatch[1].slice('media/'.length)}`
  }
  return src
}

/**
 * Constrói URL no modo Full-URL do ImageKit:
 *   https://ik.imagekit.io/{id}/tr:w-800,q-80,f-auto/<url-completa-da-imagem>
 *
 * O ImageKit busca a URL-fonte, aplica a transformação e faz cache no CDN.
 * Funciona com qualquer URL pública — sem precisar de "External Storage" configurado.
 */
export function buildImageKitUrl(src: string, opts: ImageKitOpts = {}): string {
  // Normaliza antes de qualquer coisa: URLs privadas viram /api/media/...
  const normalized = normalizeMediaSrc(src)
  if (normalized !== src) return normalized  // privado → proxy, skip ImageKit

  if (!IK_ENDPOINT) return src
  if (!src) return src
  if (src.startsWith('data:') || src.startsWith('blob:')) return src
  if (src.includes('spotify.com')) return src

  // Assets locais (SVGs, fontes etc.) que não estão no Blob
  if (src.startsWith('/') && !src.startsWith('/api/media/')) return src

  // Para o modo Full-URL, precisamos da URL pública completa da imagem
  const fullSrc = toPublicUrl(src)
  if (!fullSrc) return src

  const trParts: string[] = []
  if (opts.w) trParts.push(`w-${opts.w}`)
  trParts.push(`q-${opts.q ?? 80}`)
  trParts.push(`f-${opts.format ?? 'auto'}`)
  if (opts.blur) trParts.push(`bl-${opts.blur}`)

  const tr = trParts.join(',')
  const endpoint = IK_ENDPOINT.replace(/\/$/, '')

  // Modo Full-URL: /tr:<transformações>/<url-completa>
  return `${endpoint}/tr:${tr}/${fullSrc}`
}

/**
 * Converte qualquer forma de URL que possa estar salva no CMS para uma URL
 * pública completa que o ImageKit consegue buscar.
 *
 * Apenas URLs públicas do Vercel Blob são passadas para o ImageKit.
 * Paths /api/media/... retornam null para que o src original seja usado
 * diretamente — o proxy local serve esses blobs (possivelmente privados)
 * sem depender do ImageKit.
 */
function toPublicUrl(src: string): string | null {
  // URL pública do Vercel Blob — ImageKit consegue buscar diretamente
  if (src.includes('.public.blob.vercel-storage.com')) return src

  // URLs de outros CDNs públicos conhecidos
  if (src.startsWith('https://ik.imagekit.io')) return null // já é ImageKit, não re-envolve
  if (src.startsWith('https://') && !src.includes('/api/media/')) return src

  // /api/media/... = blob possivelmente privado.
  // O proxy /api/media/ serve com autenticação, mas o ImageKit não tem como
  // acessá-lo sem auth — retorna null para usar o proxy diretamente.
  return null
}

/** Indica se o ImageKit está configurado (para componentes decidirem fallback) */
export function isImageKitEnabled(): boolean {
  return !!IK_ENDPOINT
}
