import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
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

      setProgress({ stage: 'uploading', percentage: 0, message: 'Enviando…' })
      const safeFilename = sanitizeFilename(fileToUpload.name)
      const blob = await upload(`media/${targetDir}/${safeFilename}`, fileToUpload, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-token',
        onUploadProgress: ({ percentage }) => setUploadPct(Math.round(percentage)),
      })

      // Áudio: descriptor mínimo
      if (isAudio(rawFile)) {
        onUpload({ src: blob.url, alt: rawFile.name })
        return
      }

      // Processa variantes no servidor (sem bloquear UI se demorar)
      setProgress({ stage: 'uploading', percentage: 100, message: 'Gerando variantes responsivas…' })
      try {
        const procRes = await fetch('/api/admin/process-media', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: blob.url, kind, alt: rawFile.name }),
        })
        const procJson = await procRes.json()
        if (procJson?.ok && procJson?.descriptor) {
          onUpload(procJson.descriptor as GalleryImage)
        } else {
          // Falha no processamento — retorna descriptor minimal
          onUpload({ src: blob.url, alt: rawFile.name, kind })
        }
      } catch {
        onUpload({ src: blob.url, alt: rawFile.name, kind })
      }
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
