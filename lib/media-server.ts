import sharp from 'sharp'
import type { MediaVariantSize } from '@/types/cms'

export const VARIANT_SIZES: MediaVariantSize[] = ['400', '800', '1600', '2400']

export interface ImageProcessingResult {
  buffers: { size: MediaVariantSize; format: 'webp' | 'avif'; buffer: Buffer }[]
  lqip: string                     // data: URI base64
  width: number
  height: number
}

/**
 * Gera variantes responsivas (400/800/1600/2400 em WebP + AVIF) de uma imagem,
 * mais um LQIP base64 de 32px para placeholder instantâneo. Mantém aspect ratio.
 *
 * Decisões:
 * - WebP é sempre gerado (universal). AVIF é gerado pra navegadores modernos.
 * - LQIP em JPEG 32px qualidade 40 → ~400 bytes em base64.
 * - Sharp.rotate() aplica EXIF antes de tudo (corrige fotos giradas).
 * - Não gera variantes maiores que a imagem original (evita upscaling).
 */
export async function generateImageVariants(source: Buffer): Promise<ImageProcessingResult> {
  const image = sharp(source, { failOn: 'none' }).rotate()
  const meta = await image.metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0

  if (!width || !height) {
    throw new Error('Não foi possível ler dimensões da imagem')
  }

  // Não geramos variante maior que o original
  const allSizes: { px: number; size: MediaVariantSize }[] = [
    { px: 400, size: '400' },
    { px: 800, size: '800' },
    { px: 1600, size: '1600' },
    { px: 2400, size: '2400' },
  ]
  const targetSizes = allSizes.filter(({ px }) => px <= width || px === 400)

  const buffers: ImageProcessingResult['buffers'] = []

  for (const { px, size } of targetSizes) {
    const baseSharp = sharp(source, { failOn: 'none' })
      .rotate()
      .resize({ width: px, withoutEnlargement: true, fit: 'inside' })

    // WebP
    const webpBuffer = await baseSharp.clone().webp({ quality: 82, effort: 4 }).toBuffer()
    buffers.push({ size, format: 'webp', buffer: webpBuffer })

    // AVIF — bem mais lento mas ~30% menor
    const avifBuffer = await baseSharp.clone().avif({ quality: 55, effort: 4 }).toBuffer()
    buffers.push({ size, format: 'avif', buffer: avifBuffer })
  }

  // LQIP — 32px de largura em JPEG, base64 data URI
  const lqipBuffer = await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width: 32, withoutEnlargement: true, fit: 'inside' })
    .jpeg({ quality: 40 })
    .toBuffer()
  const lqip = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`

  return { buffers, lqip, width, height }
}

/**
 * Detecta se uma imagem tem canal alpha não-trivial (>1% pixels transparentes).
 * Usado para decidir se GIF deve virar WebM (alpha) ou MP4 (sem alpha).
 */
export async function hasTransparency(source: Buffer): Promise<boolean> {
  try {
    const { channels } = await sharp(source).stats()
    if (channels.length < 4) return false
    const alphaStdev = channels[3].stdev
    return alphaStdev > 5 // não trivialmente opaco
  } catch {
    return false
  }
}
