import { useState } from 'react'
import type { VideoItem, GalleryImage } from '@/types/cms'
import ImageUploader from './ImageUploader'
import { useDragList } from '@/hooks/useDragList'

interface VideoEditorProps {
  videos: VideoItem[]
  onChange: (videos: VideoItem[]) => void
}

export default function VideoEditor({ videos, onChange }: VideoEditorProps) {
  const [type, setType] = useState<'youtube' | 'mp4'>('youtube')
  const [title, setTitle] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const { dragIdx, overIdx, dragProps } = useDragList(videos, onChange)

  function addYoutube() {
    if (!title || !youtubeId) return
    onChange([...videos, { type: 'youtube', title, youtubeId }])
    setTitle('')
    setYoutubeId('')
  }

  function handleMp4Upload(result: GalleryImage) {
    const videoTitle = title || result.src.split('/').pop() || 'Vídeo'
    onChange([...videos, { type: 'mp4', title: videoTitle, src: result.src }])
    setTitle('')
  }

  function remove(idx: number) {
    onChange(videos.filter((_, i) => i !== idx))
  }

  function updateTitle(idx: number, newTitle: string) {
    onChange(videos.map((v, i) => (i === idx ? { ...v, title: newTitle } : v)))
  }

  return (
    <div className="space-y-4">
      {videos.map((video, idx) => {
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
        return (
          <div
            key={idx}
            {...dragProps(idx)}
            className={`flex items-center gap-3 bg-bg-card border rounded-xl p-3 transition-all ${
              isOver ? 'border-accent border-2' : 'border-bg-hover'
            } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
          >
            <span className="cursor-grab text-foreground-muted text-base select-none flex-shrink-0" title="Arraste para reordenar">⠿</span>
            <span className="text-xs text-accent font-semibold uppercase w-14 flex-shrink-0">{video.type}</span>
            <input
              type="text"
              value={video.title}
              onChange={(e) => updateTitle(idx, e.target.value)}
              className="flex-1 bg-bg border border-bg-hover rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-accent/50"
            />
            <span className="text-foreground-muted text-xs truncate max-w-[120px]">
              {video.type === 'youtube' ? video.youtubeId : video.src.split('/').pop()}
            </span>
            <button onClick={() => remove(idx)} className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10 flex-shrink-0">✕</button>
          </div>
        )
      })}

      <div className="border border-dashed border-accent/30 rounded-xl p-4 space-y-3">
        <p className="text-foreground-muted text-xs font-semibold uppercase tracking-wider">Adicionar vídeo</p>
        <div className="flex gap-2">
          <button onClick={() => setType('youtube')} className={`px-3 py-1 rounded text-xs font-semibold ${type === 'youtube' ? 'bg-accent text-bg' : 'border border-accent/40 text-accent'}`}>YouTube</button>
          <button onClick={() => setType('mp4')} className={`px-3 py-1 rounded text-xs font-semibold ${type === 'mp4' ? 'bg-accent text-bg' : 'border border-accent/40 text-accent'}`}>MP4</button>
        </div>
        <input
          type="text"
          placeholder="Título do vídeo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-bg border border-bg-hover rounded px-3 py-1.5 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
        />
        {type === 'youtube' ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ID do YouTube (ex: dQw4w9WgXcQ)"
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              className="flex-1 bg-bg border border-bg-hover rounded px-3 py-1.5 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
            />
            <button onClick={addYoutube} className="px-4 py-1.5 bg-accent text-bg text-sm rounded font-semibold hover:bg-accent-light">Adicionar</button>
          </div>
        ) : (
          <ImageUploader onUpload={handleMp4Upload} targetDir="videos" accept="video/mp4,video/*" label="Enviar MP4" />
        )}
      </div>
    </div>
  )
}
