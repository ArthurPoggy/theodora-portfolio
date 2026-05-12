import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { GalleryImage, MediaVariantSize } from '@/types/cms'

const SIZE_PX: Record<MediaVariantSize, number> = {
  '400': 400, '800': 800, '1600': 1600, '2400': 2400,
}

export type ImagePurpose = 'thumb' | 'grid' | 'lightbox' | 'hero' | 'marquee'

interface OptimizedImageProps {
  /** Descriptor completo OU string (back-compat) */
  source: GalleryImage | string
  alt?: string
  className?: string
  style?: CSSProperties
  /** Estratégia de tamanhos. Cada uma calcula `sizes` apropriado.
   * - thumb: imagem ~200-400px (lista, marquee)
   * - grid:  imagem ~280-400px em grid responsivo
   * - lightbox: imagem grande até 1600w
   * - hero: full-bleed (use com cuidado, pode pegar a maior variante)
   */
  purpose?: ImagePurpose
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  /** Override de sizes (sobrepõe o cálculo do purpose) */
  sizes?: string
  onClick?: () => void
  draggable?: boolean
}

function purposeToSizes(p: ImagePurpose): string {
  switch (p) {
    case 'thumb':    return '(max-width: 640px) 200px, 300px'
    case 'marquee':  return '320px'
    case 'grid':     return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px'
    case 'lightbox': return '(max-width: 768px) 100vw, 1600px'
    case 'hero':     return '100vw'
  }
}

/** Constrói srcSet a partir das variantes WebP do descriptor (Next.js Image cuida do resto) */
function variantUrlForPurpose(descriptor: GalleryImage, purpose: ImagePurpose): string {
  if (!descriptor.variants?.webp) return descriptor.src
  const v = descriptor.variants.webp
  // Para lightbox: 1600w. Para thumb/grid: 800w basta. Marquee: 400w.
  const preferred: MediaVariantSize = purpose === 'lightbox' ? '1600'
    : purpose === 'hero' ? '2400'
    : purpose === 'marquee' || purpose === 'thumb' ? '400'
    : '800'
  // Cai para o tamanho disponível mais próximo
  const order: MediaVariantSize[] = ['2400', '1600', '800', '400']
  const idx = order.indexOf(preferred)
  for (let i = idx; i < order.length; i++) {
    if (v[order[i]]) return v[order[i]] as string
  }
  for (let i = idx - 1; i >= 0; i--) {
    if (v[order[i]]) return v[order[i]] as string
  }
  return descriptor.src
}

export default function OptimizedImage({
  source,
  alt: altOverride,
  className,
  style,
  purpose = 'grid',
  priority = false,
  fill = false,
  width,
  height,
  sizes,
  onClick,
  draggable,
}: OptimizedImageProps) {
  const descriptor: GalleryImage = typeof source === 'string'
    ? { src: source, alt: altOverride ?? '' }
    : source

  const finalAlt = altOverride ?? descriptor.alt ?? ''
  const src = variantUrlForPurpose(descriptor, purpose)
  const finalSizes = sizes ?? purposeToSizes(purpose)

  const blurProps = descriptor.lqip
    ? { placeholder: 'blur' as const, blurDataURL: descriptor.lqip }
    : {}

  // Quando temos dimensões conhecidas e não estamos em fill, evita CLS
  const dimsKnown = descriptor.width && descriptor.height
  const useFill = fill || (!width && !height && !dimsKnown)

  if (useFill) {
    return (
      <Image
        src={src}
        alt={finalAlt}
        fill
        sizes={finalSizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={className}
        style={style}
        onClick={onClick}
        draggable={draggable}
        {...blurProps}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={finalAlt}
      width={width ?? descriptor.width ?? 800}
      height={height ?? descriptor.height ?? 600}
      sizes={finalSizes}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      className={className}
      style={style}
      onClick={onClick}
      draggable={draggable}
      {...blurProps}
    />
  )
}
