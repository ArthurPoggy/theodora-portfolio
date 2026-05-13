import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/types/cms'
import ImageUploader from './ImageUploader'
import { normalizeMediaSrc } from '@/lib/imagekit'
import { useDragList } from '@/hooks/useDragList'

interface GalleryEditorProps {
  images: GalleryImage[]
  onChange: (images: GalleryImage[]) => void
  targetDir: string
}

export default function GalleryEditor({ images, onChange, targetDir }: GalleryEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const { dragIdx, overIdx, dragProps } = useDragList(images, onChange)

  function updateImage(idx: number, patch: Partial<GalleryImage>) {
    const next = images.map((img, i) => (i === idx ? { ...img, ...patch } : img))
    onChange(next)
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  function handleUpload(result: GalleryImage) {
    onChange([...images, { ...result, alt: result.alt || '' }])
    setExpandedIdx(images.length)
  }

  return (
    <div className="space-y-3">
      <p className="text-foreground-muted text-xs italic">
        Dica: arraste pelo ícone <span className="font-mono">⠿</span> para reordenar.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((img, idx) => {
          const isDragging = dragIdx === idx
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
          return (
            <div
              key={idx}
              {...dragProps(idx)}
              className={`relative border rounded-xl overflow-hidden bg-bg-card transition-all ${
                isOver ? 'border-accent border-2' : 'border-bg-hover'
              } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            >
              {/* Handle de drag visível */}
              <div
                className="absolute top-1.5 left-1.5 z-10 bg-black/60 text-white text-base px-1.5 py-0.5 rounded cursor-grab select-none"
                title="Arraste para reordenar"
              >
                ⠿
              </div>
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <Image src={normalizeMediaSrc(img.src)} alt={img.alt || ''} fill className="object-cover" sizes="200px" unoptimized />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 hover:opacity-100 font-semibold">Editar</span>
                </div>
              </div>

              {expandedIdx === idx && (
                <div className="p-3 space-y-2 border-t border-bg-hover">
                  <input
                    type="text"
                    placeholder="Nome da obra (alt)"
                    value={img.alt}
                    onChange={(e) => updateImage(idx, { alt: e.target.value })}
                    className="w-full bg-bg border border-bg-hover rounded px-2 py-1.5 text-xs text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
                  />
                  <input
                    type="text"
                    placeholder="Título visível"
                    value={img.title || ''}
                    onChange={(e) => updateImage(idx, { title: e.target.value })}
                    className="w-full bg-bg border border-bg-hover rounded px-2 py-1.5 text-xs text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
                  />
                  <textarea
                    placeholder="Descrição da obra"
                    value={img.description || ''}
                    onChange={(e) => updateImage(idx, { description: e.target.value })}
                    rows={2}
                    className="w-full bg-bg border border-bg-hover rounded px-2 py-1.5 text-xs text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50 resize-none"
                  />
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => removeImage(idx)} className="text-xs px-2 py-1 border border-red-500/40 text-red-400 rounded hover:bg-red-500/10 ml-auto">Remover</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ImageUploader onUpload={handleUpload} targetDir={targetDir} />
    </div>
  )
}
