import Image from 'next/image'
import type { CSSProperties } from 'react'
import type { GalleryImage } from '@/types/cms'
import { buildImageKitUrl, isImageKitEnabled } from '@/lib/imagekit'

export type ImagePurpose = 'thumb' | 'grid' | 'lightbox' | 'hero' | 'marquee'

interface OptimizedImageProps {
  source: GalleryImage | string
  alt?: string
  className?: string
  style?: CSSProperties
  purpose?: ImagePurpose
  priority?: boolean
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  onClick?: () => void
  draggable?: boolean
}

const PURPOSE_WIDTHS: Record<ImagePurpose, number> = {
  thumb: 400,
  marquee: 400,
  grid: 800,
  lightbox: 1600,
  hero: 2400,
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

/** Pega a URL otimizada via ImageKit para o purpose, ou fallback */
function urlForPurpose(descriptor: GalleryImage, purpose: ImagePurpose): string {
  const w = PURPOSE_WIDTHS[purpose]
  return buildImageKitUrl(descriptor.src, { w, q: 80 })
}

function lqipForDescriptor(descriptor: GalleryImage): string | undefined {
  if (descriptor.lqip) return descriptor.lqip
  if (!isImageKitEnabled()) return undefined
  // Gera LQIP base64-like via ImageKit (32px com blur)
  return buildImageKitUrl(descriptor.src, { w: 32, blur: 50, q: 30 })
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
  const src = urlForPurpose(descriptor, purpose)
  const finalSizes = sizes ?? purposeToSizes(purpose)

  const lqip = lqipForDescriptor(descriptor)
  // ImageKit LQIPs são URLs (não data:), então não dá pra usar como blurDataURL
  // do next/image (que exige data: URI). Vamos passar só se for data:
  const blurProps = descriptor.lqip && descriptor.lqip.startsWith('data:')
    ? { placeholder: 'blur' as const, blurDataURL: descriptor.lqip }
    : {}

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
        unoptimized={isImageKitEnabled()}
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
      unoptimized={isImageKitEnabled()}
      {...blurProps}
    />
  )
}
