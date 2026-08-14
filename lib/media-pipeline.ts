/**
 * Pipeline de pré-processamento de mídia no browser, antes de subir ao Blob.
 * Imagens grandes são redimensionadas via Canvas; GIFs opacos viram MP4 via
 * FFmpeg WASM; vídeos grandes são transcodificados pra H.264 1080p.
 *
 * GIFs com transparência ficam de fora da conversão — ver `gifHasTransparency`.
 *
 * FFmpeg WASM (~30MB) só carrega quando o usuário escolhe GIF/vídeo.
 */

export type MediaKind = 'image' | 'gif' | 'video'

export interface ProcessProgress {
  stage: 'analyzing' | 'resizing' | 'transcoding' | 'uploading' | 'done'
  percentage: number
  message: string
}

export type ProgressCallback = (p: ProcessProgress) => void

export function detectMediaKind(file: File): MediaKind {
  const mime = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  if (mime === 'image/gif' || name.endsWith('.gif')) return 'gif'
  if (mime.startsWith('video/')) return 'video'
  return 'image'
}

const MAX_IMAGE_DIMENSION = 2400
const IMAGE_QUALITY = 0.92
const SIZE_THRESHOLD_BYTES = 3 * 1024 * 1024 // 3MB

/**
 * Redimensiona imagem no browser se for grande demais. Retorna o File
 * original se já está dentro dos limites (evita re-encode desnecessário).
 * Usa OffscreenCanvas quando disponível pra rodar em worker thread.
 */
export async function resizeImageInBrowser(
  file: File,
  onProgress?: ProgressCallback,
): Promise<File> {
  // Se for SVG ou WebP/AVIF pequeno, deixa passar
  if (file.type === 'image/svg+xml') return file
  if (file.size < SIZE_THRESHOLD_BYTES) {
    // Mesmo arquivos pequenos podem ter dimensões enormes; cheka rapidamente
    const meta = await readImageMeta(file)
    if (meta.width <= MAX_IMAGE_DIMENSION && meta.height <= MAX_IMAGE_DIMENSION) return file
  }

  onProgress?.({ stage: 'analyzing', percentage: 5, message: 'Analisando imagem…' })

  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(MAX_IMAGE_DIMENSION / bitmap.width, MAX_IMAGE_DIMENSION / bitmap.height, 1)
  const targetW = Math.round(bitmap.width * ratio)
  const targetH = Math.round(bitmap.height * ratio)

  onProgress?.({ stage: 'resizing', percentage: 30, message: `Redimensionando para ${targetW}×${targetH}…` })

  const canvas: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement('canvas'), { width: targetW, height: targetH })

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null
  if (!ctx) throw new Error('Canvas 2D context indisponível')
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  onProgress?.({ stage: 'resizing', percentage: 70, message: 'Codificando WebP…' })

  let blob: Blob
  if (canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: 'image/webp', quality: IMAGE_QUALITY })
  } else {
    blob = await new Promise<Blob>((resolve, reject) => {
      ;(canvas as HTMLCanvasElement).toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob falhou'))),
        'image/webp',
        IMAGE_QUALITY,
      )
    })
  }

  onProgress?.({ stage: 'resizing', percentage: 100, message: 'Pronto' })

  // Renomeia mantendo o stem mas com extensão webp
  const stem = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${stem}.webp`, { type: 'image/webp', lastModified: Date.now() })
}

/** Lê dimensões sem decodificar o frame inteiro */
async function readImageMeta(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Não conseguiu ler imagem'))
      img.src = url
    })
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// ─── FFmpeg WASM (lazy) ─────────────────────────────────────────────────

let ffmpegPromise: Promise<unknown> | null = null

interface FFmpegLike {
  load(opts?: Record<string, string>): Promise<void>
  writeFile(name: string, data: Uint8Array): Promise<void>
  readFile(name: string): Promise<Uint8Array | string>
  deleteFile(name: string): Promise<void>
  exec(args: string[]): Promise<number>
  on(event: string, cb: (data: { progress: number; time: number }) => void): void
}

async function getFFmpeg(): Promise<FFmpegLike> {
  if (ffmpegPromise) return ffmpegPromise as Promise<FFmpegLike>
  ffmpegPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')
    const ffmpeg = new FFmpeg()
    // Carrega core de CDN — evita bundle pesado no nosso build
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    return ffmpeg as unknown as FFmpegLike
  })()
  return ffmpegPromise as Promise<FFmpegLike>
}

/**
 * Detecta se o GIF usa transparência, percorrendo os blocos do arquivo atrás de
 * um Graphic Control Extension com o "transparent color flag" ligado.
 *
 * Varre todos os frames de propósito: o primeiro pode ser opaco e os seguintes
 * não. Em GIF malformado assume que há transparência — errar para esse lado só
 * custa um arquivo maior, enquanto o contrário achata o fundo pra cor sólida.
 */
export async function gifHasTransparency(file: File): Promise<boolean> {
  const b = new Uint8Array(await file.arrayBuffer())

  // Header (6 bytes) + Logical Screen Descriptor (7 bytes)
  if (b.length < 13) return true
  const lsdPacked = b[10]
  let i = 13
  if (lsdPacked & 0x80) i += 3 * (1 << ((lsdPacked & 0x07) + 1)) // Global Color Table

  // Sub-blocos são length-prefixed e terminam num byte 0x00
  const skipSubBlocks = () => {
    while (i < b.length && b[i] !== 0x00) i += b[i] + 1
    i++
  }

  while (i < b.length) {
    const introducer = b[i++]

    if (introducer === 0x3b) return false // Trailer — fim do arquivo

    if (introducer === 0x21) {            // Extension
      const label = b[i++]
      // Graphic Control Extension: bloco de 4 bytes, bit 0 do packed field
      if (label === 0xf9 && b[i] === 0x04 && (b[i + 1] & 0x01)) return true
      skipSubBlocks()
      continue
    }

    if (introducer === 0x2c) {            // Image Descriptor
      const packed = b[i + 8]
      i += 9
      if (packed & 0x80) i += 3 * (1 << ((packed & 0x07) + 1)) // Local Color Table
      i++                                 // LZW minimum code size
      skipSubBlocks()
      continue
    }

    return true                           // byte inesperado — não dá pra confiar
  }

  return false
}

/**
 * Converte GIF em MP4 (H.264 yuv420p). MP4 é geralmente 10-50× menor que GIF
 * e renderiza mais suave. Sem áudio (GIFs não têm).
 *
 * Só serve para GIF opaco: H.264 não tem canal alpha.
 */
export async function convertGifToMp4(file: File, onProgress?: ProgressCallback): Promise<File> {
  onProgress?.({ stage: 'analyzing', percentage: 0, message: 'Carregando codificador…' })
  const ffmpeg = await getFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.({
      stage: 'transcoding',
      percentage: Math.min(99, Math.round(progress * 100)),
      message: `Convertendo GIF → MP4… ${Math.round(progress * 100)}%`,
    })
  })

  const inputName = 'input.gif'
  const outputName = 'output.mp4'
  const data = new Uint8Array(await file.arrayBuffer())
  await ffmpeg.writeFile(inputName, data)

  // -movflags faststart: web streaming
  // -pix_fmt yuv420p: compatibilidade ampla
  // -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2": força dimensões pares (libx264 requer)
  await ffmpeg.exec([
    '-i', inputName,
    '-movflags', 'faststart',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264',
    '-crf', '23',
    '-preset', 'medium',
    '-an',
    outputName,
  ])

  const out = await ffmpeg.readFile(outputName)
  const buffer = typeof out === 'string' ? new TextEncoder().encode(out) : out
  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})

  onProgress?.({ stage: 'done', percentage: 100, message: 'Convertido' })

  const stem = file.name.replace(/\.[^.]+$/, '')
  // Cria Blob a partir de Uint8Array (evita conflito de tipos)
  return new File([new Blob([buffer], { type: 'video/mp4' })], `${stem}.mp4`, {
    type: 'video/mp4',
    lastModified: Date.now(),
  })
}

const MAX_VIDEO_HEIGHT = 1080
const VIDEO_THRESHOLD_BYTES = 20 * 1024 * 1024

/**
 * Comprime vídeo se for grande (> 20MB ou > 1080p). Mantém o original
 * se já está leve.
 */
export async function transcodeVideo(file: File, onProgress?: ProgressCallback): Promise<File> {
  if (file.size < VIDEO_THRESHOLD_BYTES) return file

  onProgress?.({ stage: 'analyzing', percentage: 0, message: 'Carregando codificador…' })
  const ffmpeg = await getFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    onProgress?.({
      stage: 'transcoding',
      percentage: Math.min(99, Math.round(progress * 100)),
      message: `Comprimindo vídeo… ${Math.round(progress * 100)}%`,
    })
  })

  const ext = file.name.match(/\.[^.]+$/)?.[0] || '.mp4'
  const inputName = `input${ext}`
  const outputName = 'output.mp4'

  const data = new Uint8Array(await file.arrayBuffer())
  await ffmpeg.writeFile(inputName, data)

  await ffmpeg.exec([
    '-i', inputName,
    '-movflags', 'faststart',
    '-pix_fmt', 'yuv420p',
    '-vf', `scale='if(gt(ih,${MAX_VIDEO_HEIGHT}),trunc(iw*${MAX_VIDEO_HEIGHT}/ih/2)*2,iw)':'min(ih,${MAX_VIDEO_HEIGHT})'`,
    '-c:v', 'libx264',
    '-crf', '24',
    '-preset', 'medium',
    '-c:a', 'aac',
    '-b:a', '128k',
    outputName,
  ])

  const out = await ffmpeg.readFile(outputName)
  const buffer = typeof out === 'string' ? new TextEncoder().encode(out) : out
  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})

  onProgress?.({ stage: 'done', percentage: 100, message: 'Comprimido' })

  const stem = file.name.replace(/\.[^.]+$/, '')
  return new File([new Blob([buffer], { type: 'video/mp4' })], `${stem}.mp4`, {
    type: 'video/mp4',
    lastModified: Date.now(),
  })
}

/**
 * Pipeline completa: detecta tipo, pré-processa e devolve File otimizado.
 */
export async function preprocessMedia(
  file: File,
  onProgress?: ProgressCallback,
): Promise<{ file: File; kind: 'image' | 'video' }> {
  const kind = detectMediaKind(file)

  if (kind === 'gif') {
    // H.264 não carrega canal alpha: converter um GIF transparente achata o
    // fundo numa cor sólida (branco, no caso dos GIFs decorativos da artista).
    // Nesses casos o arquivo sobe cru — nada de Canvas aqui, que achataria a
    // animação num frame só.
    if (await gifHasTransparency(file)) {
      onProgress?.({ stage: 'done', percentage: 100, message: 'GIF transparente — enviado sem conversão' })
      return { file, kind: 'image' }
    }
    const mp4 = await convertGifToMp4(file, onProgress)
    return { file: mp4, kind: 'video' }
  }
  if (kind === 'video') {
    const compressed = await transcodeVideo(file, onProgress)
    return { file: compressed, kind: 'video' }
  }
  const resized = await resizeImageInBrowser(file, onProgress)
  return { file: resized, kind: 'image' }
}
