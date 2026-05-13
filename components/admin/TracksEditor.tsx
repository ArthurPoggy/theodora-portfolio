import type { Track, GalleryImage } from '@/types/cms'
import ImageUploader from './ImageUploader'
import { useDragList } from '@/hooks/useDragList'

interface TracksEditorProps {
  tracks: Track[]
  onChange: (tracks: Track[]) => void
}

export default function TracksEditor({ tracks, onChange }: TracksEditorProps) {
  const { dragIdx, overIdx, dragProps } = useDragList(tracks, onChange)

  function update(idx: number, patch: Partial<Track>) {
    onChange(tracks.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  function remove(idx: number) {
    onChange(tracks.filter((_, i) => i !== idx))
  }

  function handleUpload(result: GalleryImage) {
    const filename = result.src.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Faixa'
    onChange([...tracks, { title: filename, src: result.src }])
  }

  return (
    <div className="space-y-3">
      {tracks.length === 0 && (
        <p className="text-foreground-muted text-sm italic">Nenhuma música adicionada ainda.</p>
      )}
      {tracks.map((t, idx) => {
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
        return (
          <div
            key={idx}
            {...dragProps(idx)}
            className={`flex gap-3 items-center bg-bg-card border rounded-xl p-3 transition-all ${
              isOver ? 'border-accent border-2' : 'border-bg-hover'
            } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
          >
            <span className="cursor-grab text-foreground-muted text-base select-none flex-shrink-0" title="Arraste para reordenar">⠿</span>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={t.title}
                onChange={(e) => update(idx, { title: e.target.value })}
                placeholder="Título"
                className="w-full bg-bg border border-bg-hover rounded px-2 py-1.5 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
              />
              <input
                type="text"
                value={t.artist || ''}
                onChange={(e) => update(idx, { artist: e.target.value })}
                placeholder="Artista (opcional)"
                className="w-full bg-bg border border-bg-hover rounded px-2 py-1.5 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
              />
              <p className="text-foreground-muted text-xs truncate">{t.src}</p>
            </div>
            <button onClick={() => remove(idx)} className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10 flex-shrink-0">✕</button>
          </div>
        )
      })}
      <ImageUploader onUpload={handleUpload} targetDir="audio" accept="audio/*,.mp3,.ogg,.wav" label="Enviar música" />
    </div>
  )
}
