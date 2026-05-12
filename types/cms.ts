// ─── Media descriptor (otimização) ──────────────────────────────────────
// Cada variante é uma URL pública do CDN do Vercel Blob.
// Backward-compat: dados antigos só com `src` + `alt` ainda funcionam — os
// componentes detectam ausência de variants e usam src diretamente.

export type MediaVariantSize = '400' | '800' | '1600' | '2400'

export interface MediaVariants {
  webp: Partial<Record<MediaVariantSize, string>>
  avif?: Partial<Record<MediaVariantSize, string>>
}

export interface GalleryImage {
  src: string                       // URL principal (maior WebP para imagem, MP4 para vídeo)
  alt: string
  title?: string
  description?: string

  // Campos opcionais — preenchidos por process-media:
  kind?: 'image' | 'video'
  variants?: MediaVariants          // só para imagens
  original?: string                 // URL do arquivo cru (lightbox "ver original")
  poster?: string                   // poster do vídeo
  width?: number                    // dimensões intrínsecas (evita CLS)
  height?: number
  lqip?: string                     // base64 32px placeholder
}

export function isVideoMedia(img: { kind?: string; src: string }): boolean {
  return img.kind === 'video' || /\.(mp4|webm|mov)$/i.test(img.src)
}

// ─── Galerias ───────────────────────────────────────────────────────────

export interface ConceptArtGallery {
  cenario: GalleryImage[]
  personagem: GalleryImage[]
}

export interface GalleriesData {
  modelagem3d: GalleryImage[]
  ilustracoes: GalleryImage[]
  conceptArt: ConceptArtGallery
  trabalhosFisicos: GalleryImage[]
  encomendados: GalleryImage[]
  branding: GalleryImage[]
  nsfw: GalleryImage[]
}

export type VideoItem =
  | { type: 'youtube'; title: string; youtubeId: string }
  | { type: 'mp4'; title: string; src: string }

export interface AnimationsData {
  gifs: GalleryImage[]
  videos: VideoItem[]
}

export interface AboutData {
  bio: string[]
  skills: string[]
  photoSrc: string
}

export interface Testimonial {
  text: string
  author: string
  role?: string
}

export interface Track {
  title: string
  artist?: string
  src: string
}

export interface MarqueeItem {
  src: string
  alt: string
  href: string
  category: string
}

export interface HomeData {
  heroText: string
  heroBio: string
  marqueeRow1: MarqueeItem[]
  marqueeRow2: MarqueeItem[]
}

export interface SocialLinks {
  linkedin: string
  bluesky: string
  itchio: string
}

export interface ImageUploadPayload {
  filename: string
  base64: string
  mimeType: string
  targetDir: string
}

export interface ApiResponse<T = void> {
  ok: boolean
  data?: T
  error?: string
}

// ─── Media Overlays ─────────────────────────────────────────────────────

export type OverlayMediaType = 'image' | 'video' | 'spotify'
export type OverlayPositioning = 'page' | 'viewport'
export type OverlayAnchor = 'tl' | 'tr' | 'bl' | 'br'

export interface MediaOverlay {
  id: string
  src: string                      // URL do CDN ou embed Spotify
  type: OverlayMediaType
  positioning: OverlayPositioning
  anchor: OverlayAnchor
  x: number                        // % da largura do viewport
  y: number                        // px do anchor vertical
  width: number                    // % da largura do viewport
  height?: number                  // px (Spotify)
  rotation: number
  zIndex: number
  visible: boolean
  hideOnMobile: boolean
  // Otimização (opcional):
  poster?: string                  // poster do vídeo overlay
  lqip?: string
}

export type OverlaysData = Record<string, MediaOverlay[]>
