import { useRef, useState } from 'react'

interface ImageUploaderProps {
  onUpload: (publicPath: string) => void
  targetDir: string
  accept?: string
  label?: string
}

export default function ImageUploader({ onUpload, targetDir, accept = 'image/*', label = 'Adicionar imagem' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    setUploading(true)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          base64,
          mimeType: file.type,
          targetDir,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Erro no upload')
      onUpload(json.data.publicPath)
    } catch (e) {
      setError(String(e))
    } finally {
      setUploading(false)
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
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
            Enviando...
          </>
        ) : (
          <>+ {label}</>
        )}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
