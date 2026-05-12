import type { CSSProperties } from 'react'
import OptimizedImage, { type ImagePurpose } from './OptimizedImage'
import { isVideoMedia, type GalleryImage } from '@/types/cms'

interface OptimizedMediaProps {
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
  /** Para vídeos: deve auto-tocar mute em loop? */
  loop?: boolean
  controls?: boolean
}

/**
 * Renderiza imagem (via OptimizedImage) ou vídeo `<video>` conforme o
 * descriptor. Vídeos usam preload="metadata" — só metadata baixa até user
 * interagir. Poster é mostrado enquanto o vídeo não está visível.
 */
export default function OptimizedMedia({
  source,
  alt,
  className,
  style,
  purpose,
  priority,
  fill,
  width,
  height,
  sizes,
  onClick,
  loop = true,
  controls = false,
}: OptimizedMediaProps) {
  const descriptor: GalleryImage = typeof source === 'string'
    ? { src: source, alt: alt ?? '' }
    : source

  if (isVideoMedia(descriptor)) {
    const videoStyle: CSSProperties = fill
      ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
      : { width: '100%', height: 'auto', display: 'block', ...style }
    return (
      <video
        src={descriptor.src}
        poster={descriptor.poster}
        className={className}
        style={videoStyle}
        autoPlay
        loop={loop}
        muted
        playsInline
        controls={controls}
        preload="metadata"
        onClick={onClick}
      />
    )
  }

  return (
    <OptimizedImage
      source={descriptor}
      alt={alt}
      className={className}
      style={style}
      purpose={purpose}
      priority={priority}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      onClick={onClick}
    />
  )
}
