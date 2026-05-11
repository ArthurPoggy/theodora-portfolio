import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

interface ImageUploaderProps {
  onUpload: (publicPath: string) => void
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

export default function ImageUploader({ onUpload, targetDir, accept = 'image/*', label = 'Adicionar imagem' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setProgress(0)
    setUploading(true)
    try {
      const safeFilename = sanitizeFilename(file.name)
      const blob = await upload(`media/${targetDir}/${safeFilename}`, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/upload-token',
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      })
      // Converte pathname do blob para URL da rota proxy
      // blob.pathname = 'media/overlays/foo.gif' → '/api/media/overlays/foo.gif'
      const proxyPath = '/api/' + blob.pathname
      onUpload(proxyPath)
    } catch (e) {
      setError(String(e))
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 border border-dashed border-accent/40 text-accent text-sm rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {uploading ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {progress > 0 ? `${progress}%` : 'Preparando...'}
          </>
        ) : (
          <>+ {label}</>
        )}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
