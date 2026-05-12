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
 * Constrói URL no modo Full-URL do ImageKit:
 *   https://ik.imagekit.io/{id}/tr:w-800,q-80,f-auto/<url-completa-da-imagem>
 *
 * O ImageKit busca a URL-fonte, aplica a transformação e faz cache no CDN.
 * Funciona com qualquer URL pública — sem precisar de "External Storage" configurado.
 */
export function buildImageKitUrl(src: string, opts: ImageKitOpts = {}): string {
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
 * Aceita:
 *   https://{store}.public.blob.vercel-storage.com/media/...  → retorna como está
 *   /api/media/dir/file.jpg                                    → não pode resolver no cliente (retorna null)
 *   media/dir/file.jpg                                         → não pode resolver sem o store ID (retorna null)
 */
function toPublicUrl(src: string): string | null {
  // Já é URL pública completa do Vercel Blob — perfeito para Full-URL mode
  if (src.includes('blob.vercel-storage.com')) return src

  // URLs de outros CDNs públicos (ex: se já migrou para outro provider)
  if (src.startsWith('https://')) return src

  // Paths legados /api/media/... não têm base URL disponível no cliente,
  // mas /api/media/ já faz redirect 308 para a URL pública do blob,
  // então o ImageKit vai seguir o redirect e achar o arquivo.
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || ''

  if (baseUrl && src.startsWith('/api/media/')) {
    return `${baseUrl}${src}`
  }

  return null
}

/** Indica se o ImageKit está configurado (para componentes decidirem fallback) */
export function isImageKitEnabled(): boolean {
  return !!IK_ENDPOINT
}
