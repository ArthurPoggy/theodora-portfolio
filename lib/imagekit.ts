/**
 * Helper para construir URLs do ImageKit a partir de URLs do Vercel Blob.
 *
 * Configuração: definir NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT no env, ex:
 *   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/theodorad
 *
 * No painel ImageKit, configurar External Storage (Origin) apontando para
 * a URL pública do Vercel Blob:
 *   URL endpoint type: Web Folder
 *   Web folder origin: https://{store-id}.public.blob.vercel-storage.com
 *   Origin identifier: vercel-blob
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
 * Constrói a URL do ImageKit ou retorna a URL original se não houver
 * endpoint configurado / se o src não for transformável.
 */
export function buildImageKitUrl(src: string, opts: ImageKitOpts = {}): string {
  // Sem ImageKit configurado? Retorna o original
  if (!IK_ENDPOINT) return src

  // Não tenta transformar: SVGs locais, dataURIs, embeds Spotify, etc.
  if (!src) return src
  if (src.startsWith('data:') || src.startsWith('blob:')) return src
  if (src.includes('spotify.com')) return src
  if (src.startsWith('/') && !src.startsWith('/api/media/')) return src // assets locais

  // Extrai o pathname dentro do origin do Vercel Blob
  const pathname = extractPathname(src)
  if (!pathname) return src

  // Monta transformação ImageKit. Valores recomendados:
  //   q-80 = qualidade boa com tamanho enxuto
  //   f-auto = ImageKit escolhe WebP/AVIF baseado em Accept header
  //   tr=blur-X para LQIP
  const trParts: string[] = []
  if (opts.w) trParts.push(`w-${opts.w}`)
  trParts.push(`q-${opts.q ?? 80}`)
  trParts.push(`f-${opts.format ?? 'auto'}`)
  if (opts.blur) trParts.push(`bl-${opts.blur}`)

  const tr = trParts.join(',')
  // Path no ImageKit é o mesmo pathname relativo do origin (sem o /media/ prefix
  // porque o origin já é o Vercel Blob inteiro)
  const endpoint = IK_ENDPOINT.replace(/\/$/, '')
  return `${endpoint}/${pathname}?tr=${tr}`
}

/**
 * Extrai o pathname relativo do origin Vercel Blob a partir de qualquer
 * forma de URL que possamos ter armazenado.
 *
 * Aceita:
 *   - https://{store}.public.blob.vercel-storage.com/media/dir/file.jpg → media/dir/file.jpg
 *   - /api/media/dir/file.jpg → media/dir/file.jpg
 *   - media/dir/file.jpg → media/dir/file.jpg
 */
function extractPathname(url: string): string | null {
  // URL pública do Vercel Blob
  const blobMatch = url.match(/\.public\.blob\.vercel-storage\.com\/(.+?)(?:\?|$)/)
  if (blobMatch) return blobMatch[1]
  // Proxy legado
  const proxyMatch = url.match(/\/api\/media\/(.+?)(?:\?|$)/)
  if (proxyMatch) return `media/${proxyMatch[1]}`
  // Já é pathname relativo
  if (url.startsWith('media/')) return url
  return null
}

/** Indica se o ImageKit está configurado (para componentes decidirem fallback) */
export function isImageKitEnabled(): boolean {
  return !!IK_ENDPOINT
}
