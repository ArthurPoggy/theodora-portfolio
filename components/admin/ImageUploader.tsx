import { useRef, useState } from 'react'
import { preprocessMedia, type ProcessProgress } from '@/lib/media-pipeline'
import type { GalleryImage } from '@/types/cms'

interface ImageUploaderProps {
  /** Recebe o descriptor completo (com variants/LQIP) quando aplicável.
   * Para áudio/casos legados, apenas `src` é populado. */
  onUpload: (result: GalleryImage) => void
  targetDir: string
  accept?: string
  label?: string
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function isAudio(file: File): boolean {
  return file.type.startsWith('audio/')
}

interface UploadAuth {
  token: string
  expire: number
  signature: string
  publicKey: string
  urlEndpoint: string
}

/** Faz POST multipart pro ImageKit com progresso. Usa XHR (fetch não expõe upload progress). */
function uploadToImageKit(
  file: File,
  folder: string,
  fileName: string,
  auth: UploadAuth,
  onProgress: (pct: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    form.append('fileName', fileName)
    form.append('folder', folder)
    form.append('useUniqueFileName', 'false')
    form.append('overwriteFile', 'true')
    form.append('publicKey', auth.publicKey)
    form.append('signature', auth.signature)
    form.append('expire', String(auth.expire))
    form.append('token', auth.token)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as { url: string }
          resolve(json)
        } catch {
          reject(new Error(`Resposta inválida do ImageKit: ${xhr.responseText.slice(0, 200)}`))
        }
      } else {
        reject(new Error(`Upload falhou (${xhr.status}): ${xhr.responseText.slice(0, 300)}`))
      }
    }
    xhr.onerror = () => reject(new Error('Erro de rede durante upload'))
    xhr.send(form)
  })
}

export default function ImageUploader({ onUpload, targetDir, accept = 'image/*', label = 'Adicionar imagem' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<ProcessProgress | null>(null)
  const [uploadPct, setUploadPct] = useState(0)
  const [error, setError] = useState('')

  async function handleFile(rawFile: File) {
    setError('')
    setProgress(null)
    setUploadPct(0)
    setUploading(true)
    try {
      let fileToUpload = rawFile
      let kind: 'image' | 'video' = 'image'

      // Áudio: sem pré-processamento; só upload
      if (!isAudio(rawFile)) {
        const result = await preprocessMedia(rawFile, (p) => setProgress(p))
        fileToUpload = result.file
        kind = result.kind
      }

      setProgress({ stage: 'uploading', percentage: 0, message: 'Pegando token…' })
      const tokenRes = await fetch('/api/admin/upload-token', { method: 'POST', credentials: 'include' })
      if (!tokenRes.ok) throw new Error(`Falha ao obter token (${tokenRes.status})`)
      const auth = await tokenRes.json() as UploadAuth

      const safeFilename = sanitizeFilename(fileToUpload.name)
      setProgress({ stage: 'uploading', percentage: 0, message: 'Enviando…' })
      const { url } = await uploadToImageKit(
        fileToUpload,
        `media/${targetDir}`,
        safeFilename,
        auth,
        (pct) => setUploadPct(pct),
      )

      // Áudio: descriptor mínimo
      if (isAudio(rawFile)) {
        onUpload({ src: url, alt: rawFile.name })
        return
      }

      // Variantes responsivas são geradas on-the-fly pelo ImageKit no momento
      // da renderização — não precisa de processamento server-side.
      onUpload({ src: url, alt: rawFile.name, kind })
    } catch (e) {
      setError(String(e))
    } finally {
      setUploading(false)
      setProgress(null)
      setUploadPct(0)
    }
  }

  const buttonLabel = (() => {
    if (!uploading) return `+ ${label}`
    if (progress?.stage === 'uploading' && uploadPct > 0 && uploadPct < 100) return `Enviando… ${uploadPct}%`
    if (progress) return `${progress.message}${progress.percentage > 0 && progress.percentage < 100 ? ` ${progress.percentage}%` : ''}`
    return 'Preparando…'
  })()

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 border border-dashed border-accent/40 text-accent text-sm rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {uploading && (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        )}
        <span className="whitespace-nowrap">{buttonLabel}</span>
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
