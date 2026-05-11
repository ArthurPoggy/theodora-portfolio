export interface GalleryImage {
  src: string
  alt: string
  title?: string
  description?: string
}

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

// ── Media Overlays ──────────────────────────────────────────────────────
// Sistema de mídias decorativas posicionáveis pelo admin em qualquer página

export type OverlayMediaType = 'image' | 'video'
export type OverlayPositioning = 'page' | 'viewport'   // page = absolute no Layout wrapper; viewport = fixed
export type OverlayAnchor = 'tl' | 'tr' | 'bl' | 'br'  // canto de referência

export interface MediaOverlay {
  id: string                       // crypto.randomUUID()
  src: string                      // /images/overlays/foo.gif
  type: OverlayMediaType
  positioning: OverlayPositioning
  anchor: OverlayAnchor
  x: number                        // % da largura do viewport (0-100), a partir do anchor horizontal
  y: number                        // px a partir do anchor vertical (page = relativo ao Layout; viewport = relativo à viewport)
  width: number                    // % da largura do viewport (0-100)
  rotation: number                 // graus (-180 a 180)
  zIndex: number                   // 2-29 (entre Sparkles=1 e Win98Scrollbar=30)
  visible: boolean
  hideOnMobile: boolean            // esconde em viewport < lg (1024px)
}

// chave = router.pathname normalizado: '/', '/sobre', '/modelagem-3d', etc.
export type OverlaysData = Record<string, MediaOverlay[]>
