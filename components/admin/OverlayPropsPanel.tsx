import { useState } from 'react'
import type { MediaOverlay, OverlayAnchor, OverlayPositioning } from '@/types/cms'
import ImageUploader from './ImageUploader'

interface OverlayPropsPanelProps {
  overlay: MediaOverlay
  onChange: (patch: Partial<MediaOverlay>) => void
}

const ANCHOR_OPTIONS: { value: OverlayAnchor; label: string }[] = [
  { value: 'tl', label: '↖ Topo-Esq' },
  { value: 'tr', label: '↗ Topo-Dir' },
  { value: 'bl', label: '↙ Base-Esq' },
  { value: 'br', label: '↘ Base-Dir' },
]

const POSITIONING_OPTIONS: { value: OverlayPositioning; label: string; hint: string }[] = [
  { value: 'page', label: 'Página', hint: 'Rola com o conteúdo' },
  { value: 'viewport', label: 'Viewport', hint: 'Fixo na tela' },
]

function detectMediaType(src: string): 'image' | 'video' {
  return /\.mp4$/i.test(src) ? 'video' : 'image'
}

function toSpotifyEmbedUrl(input: string): string | null {
  try {
    const url = new URL(input.trim())
    if (!url.hostname.includes('spotify.com')) return null
    const parts = url.pathname.replace('/embed', '').split('/').filter(Boolean)
    if (parts.length < 2) return null
    return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`
  } catch { return null }
}

export default function OverlayPropsPanel({ overlay, onChange }: OverlayPropsPanelProps) {
  const [spotifyInput, setSpotifyInput] = useState(overlay.src)
  const [spotifyError, setSpotifyError] = useState('')
  const isSpotify = overlay.type === 'spotify'

  return (
    <div className="space-y-5">
      {/* Preview / Spotify URL */}
      <div>
        <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">
          {isSpotify ? 'Link do Spotify' : 'Mídia atual'}
        </label>

        {isSpotify ? (
          <div>
            <input
              type="text"
              value={spotifyInput}
              onChange={(e) => { setSpotifyInput(e.target.value); setSpotifyError('') }}
              placeholder="URL do Spotify…"
              className="w-full bg-bg border border-bg-hover rounded-lg px-3 py-2 text-xs text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent/50 mb-1"
            />
            {spotifyError && <p className="text-red-400 text-[10px] mb-1">{spotifyError}</p>}
            <button
              onClick={() => {
                const embed = toSpotifyEmbedUrl(spotifyInput)
                if (!embed) { setSpotifyError('URL inválida'); return }
                onChange({ src: embed })
                setSpotifyError('')
              }}
              className="px-3 py-1.5 bg-[#1DB954] text-black text-xs font-semibold rounded-lg hover:bg-[#1ed760] transition-colors"
            >
              Atualizar URL
            </button>
          </div>
        ) : (
          <>
            <div className="bg-bg border border-bg-hover rounded-lg p-3 flex items-center gap-3">
              {overlay.type === 'video' ? (
                <video src={overlay.src} muted loop autoPlay playsInline className="w-20 h-20 object-contain bg-black/40 rounded" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={overlay.src} alt="" className="w-20 h-20 object-contain bg-black/40 rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs truncate" title={overlay.src}>{overlay.src.split('/').pop()}</p>
                <p className="text-foreground-muted text-xs mt-0.5">{overlay.type === 'video' ? 'Vídeo' : 'Imagem/GIF'}</p>
              </div>
            </div>
            <div className="mt-2">
              <ImageUploader
                onUpload={(src) => onChange({ src, type: detectMediaType(src) })}
                targetDir="overlays"
                accept="image/*,video/mp4"
                label="Trocar mídia"
              />
            </div>
          </>
        )}
      </div>

      {/* Posicionamento (page vs viewport) */}
      <div>
        <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">Posicionamento</label>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ positioning: opt.value })}
              className={`px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                overlay.positioning === opt.value
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-bg border border-bg-hover text-foreground-muted hover:border-accent/30'
              }`}
            >
              <div className="font-semibold">{opt.label}</div>
              <div className="text-[10px] opacity-70">{opt.hint}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Âncora (canto de referência) */}
      <div>
        <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">Âncora (canto de referência)</label>
        <div className="grid grid-cols-2 gap-2">
          {ANCHOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ anchor: opt.value })}
              className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                overlay.anchor === opt.value
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-bg border border-bg-hover text-foreground-muted hover:border-accent/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posição numérica */}
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="X (% viewport)" hint="Distância horizontal" value={overlay.x} step={0.1} onChange={(x) => onChange({ x })} />
        <NumInput label="Y (px)" hint="Distância vertical" value={overlay.y} step={1} onChange={(y) => onChange({ y })} />
        <NumInput
          label="Largura (% viewport)"
          hint={isSpotify ? 'Largura do player' : 'Altura automática'}
          value={overlay.width}
          step={0.1} min={0.5} max={100}
          onChange={(width) => onChange({ width })}
        />
        {isSpotify ? (
          <NumInput
            label="Altura (px)"
            hint="152 = compacto, 352 = completo"
            value={overlay.height ?? 152}
            step={8} min={80} max={600}
            onChange={(height) => onChange({ height })}
          />
        ) : (
          <NumInput
            label="Rotação (°)"
            hint="-180 a 180"
            value={overlay.rotation}
            step={1} min={-180} max={180}
            onChange={(rotation) => onChange({ rotation })}
          />
        )}
        <NumInput label="Z-Index" hint="Spotify: use 45+ (MusicPlayer=40)" value={overlay.zIndex} step={1} min={2} max={99} onChange={(zIndex) => onChange({ zIndex })} />
      </div>

      {/* Toggles */}
      <div className="space-y-2 pt-2 border-t border-bg-hover">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={overlay.visible} onChange={(e) => onChange({ visible: e.target.checked })} className="accent-accent" />
          <span className="text-foreground text-sm">Visível</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={overlay.hideOnMobile} onChange={(e) => onChange({ hideOnMobile: e.target.checked })} className="accent-accent" />
          <span className="text-foreground text-sm">Esconder em mobile (&lt;1024px)</span>
        </label>
      </div>
    </div>
  )
}

interface NumInputProps {
  label: string
  hint?: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (v: number) => void
}

function NumInput({ label, hint, value, step = 1, min, max, onChange }: NumInputProps) {
  return (
    <div>
      <label className="block text-foreground-muted text-[11px] uppercase tracking-wider mb-1">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="w-full bg-bg-card border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
      />
      {hint && <p className="text-foreground-muted text-[10px] mt-1">{hint}</p>}
    </div>
  )
}
