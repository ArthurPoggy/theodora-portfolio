import { useRef, useState, useEffect, useCallback } from 'react'
import { Rnd } from 'react-rnd'
import type { OverlaysData, MediaOverlay, PagesData } from '@/types/cms'
import ImageUploader from './ImageUploader'
import OverlayPropsPanel from './OverlayPropsPanel'

function toSpotifyEmbedUrl(input: string): string | null {
  try {
    const url = new URL(input.trim())
    if (!url.hostname.includes('spotify.com')) return null
    const parts = url.pathname.replace('/embed', '').split('/').filter(Boolean)
    if (parts.length < 2) return null
    return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}?utm_source=generator&theme=0`
  } catch {
    return null
  }
}

interface OverlaysEditorProps {
  data: OverlaysData
  onChange: (data: OverlaysData) => void
}

const FIXED_PAGES: { route: string; label: string }[] = [
  { route: '/', label: 'Home' },
  { route: '/sobre', label: 'Sobre' },
  { route: '/contato', label: 'Contato' },
]

// Largura nativa do canvas (representa a largura real do viewport 1440px)
const NATIVE_W = 1440
// Altura nativa — canvas rola verticalmente para representar a página inteira
const NATIVE_H = 3200

function detectMediaType(src: string): 'image' | 'video' {
  return /\.mp4$/i.test(src) ? 'video' : 'image'
}

function newOverlay(src: string): MediaOverlay {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `overlay-${Date.now()}`,
    src,
    type: detectMediaType(src),
    positioning: 'page',
    anchor: 'tl',
    x: 40,
    y: 200,
    width: 10,
    rotation: 0,
    zIndex: 10,
    visible: true,
    hideOnMobile: true,
  }
}

function newSpotifyOverlay(embedUrl: string): MediaOverlay {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `overlay-${Date.now()}`,
    src: embedUrl,
    type: 'spotify',
    positioning: 'viewport',
    anchor: 'br',
    x: 2,
    y: 20,
    width: 22,
    height: 152,
    rotation: 0,
    zIndex: 45, // acima do MusicPlayer (40) e Win98Scrollbar (30)
    visible: true,
    hideOnMobile: true,
  }
}

// Converte coordenadas armazenadas → pixels no canvas (sempre top-left)
function toCanvasPos(item: MediaOverlay, canvasW: number, canvasH: number, aspectRatio: number) {
  const scale = canvasW / NATIVE_W
  const w = (item.width / 100) * canvasW
  const h = aspectRatio > 0 ? w / aspectRatio : w

  let x: number
  if (item.anchor === 'tl' || item.anchor === 'bl') {
    x = (item.x / 100) * canvasW
  } else {
    x = canvasW - w - (item.x / 100) * canvasW
  }

  let y: number
  if (item.anchor === 'tl' || item.anchor === 'tr') {
    y = item.y * scale
  } else {
    y = canvasH - h - item.y * scale
  }

  return { x, y, w, h }
}

// Converte pixels do canvas após drag → coordenadas armazenadas
function fromCanvasPos(
  xPx: number, yPx: number,
  item: MediaOverlay,
  canvasW: number, canvasH: number,
  widthPx: number, heightPx: number
) {
  const scale = canvasW / NATIVE_W
  let x: number
  if (item.anchor === 'tl' || item.anchor === 'bl') {
    x = (xPx / canvasW) * 100
  } else {
    x = ((canvasW - widthPx - xPx) / canvasW) * 100
  }

  let y: number
  if (item.anchor === 'tl' || item.anchor === 'tr') {
    y = yPx / scale
  } else {
    y = (canvasH - heightPx - yPx) / scale
  }

  return { x: Math.round(x * 100) / 100, y: Math.round(y) }
}

export default function OverlaysEditor({ data, onChange }: OverlaysEditorProps) {
  const [selectedPage, setSelectedPage] = useState<string>('/')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canvasW, setCanvasW] = useState(900)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [spotifyInput, setSpotifyInput] = useState('')
  const [spotifyError, setSpotifyError] = useState('')
  // src -> aspect ratio (natural)
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({})
  const [PAGES, setPages] = useState<{ route: string; label: string }[]>(FIXED_PAGES)

  useEffect(() => {
    fetch('/api/public/pages')
      .then((r) => r.ok ? r.json() as Promise<PagesData> : [])
      .then((pages) => {
        const dynamic = (Array.isArray(pages) ? pages : [])
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ route: `/${p.slug}`, label: p.label }))
        setPages([...FIXED_PAGES, ...dynamic])
      })
      .catch(() => { /* mantém apenas FIXED_PAGES */ })
  }, [])

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<OverlaysData>(data)
  dataRef.current = data

  // Mede a largura real do container do canvas
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setCanvasW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = canvasW / NATIVE_W
  const canvasH = NATIVE_H * scale

  const pageOverlays = data[selectedPage] || []
  const selected = pageOverlays.find((o) => o.id === selectedId) || null

  function setPageOverlays(list: MediaOverlay[]) {
    const next = { ...dataRef.current }
    if (list.length === 0) delete next[selectedPage]
    else next[selectedPage] = list
    onChange(next)
  }

  function updateOverlay(id: string, patch: Partial<MediaOverlay>) {
    const list = (dataRef.current[selectedPage] || []).map((o) => (o.id === id ? { ...o, ...patch } : o))
    setPageOverlays(list)
  }

  function deleteOverlay(id: string) {
    const list = (dataRef.current[selectedPage] || []).filter((o) => o.id !== id)
    setPageOverlays(list)
    if (selectedId === id) setSelectedId(null)
  }

  function addOverlay(src: string) {
    const created = newOverlay(src)
    const list = [...(dataRef.current[selectedPage] || []), created]
    setPageOverlays(list)
    setSelectedId(created.id)
  }

  function addSpotifyOverlay() {
    setSpotifyError('')
    const embedUrl = toSpotifyEmbedUrl(spotifyInput)
    if (!embedUrl) {
      setSpotifyError('URL inválida. Cole um link do Spotify (playlist, álbum, track…)')
      return
    }
    const created = newSpotifyOverlay(embedUrl)
    const list = [...(dataRef.current[selectedPage] || []), created]
    setPageOverlays(list)
    setSelectedId(created.id)
    setSpotifyInput('')
  }

  function moveZ(id: string, dir: 1 | -1) {
    const overlay = (dataRef.current[selectedPage] || []).find((o) => o.id === id)
    if (!overlay) return
    updateOverlay(id, { zIndex: Math.max(2, Math.min(29, overlay.zIndex + dir)) })
  }

  const registerAspectRatio = useCallback((src: string, ratio: number) => {
    setAspectRatios((prev) => (prev[src] === ratio ? prev : { ...prev, [src]: ratio }))
  }, [])

  useEffect(() => {
    setIframeLoaded(false)
    setSelectedId(null)
  }, [selectedPage])

  // Fecha seleção ao clicar no canvas (não em item)
  function handleCanvasClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) setSelectedId(null)
  }

  return (
    <div>
      {/* Page selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PAGES.map((p) => {
          const count = data[p.route]?.length || 0
          const active = selectedPage === p.route
          return (
            <button
              key={p.route}
              onClick={() => { setSelectedPage(p.route); setSelectedId(null) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                active ? 'bg-accent text-bg' : 'bg-bg-card border border-bg-hover text-foreground-muted hover:border-accent/40'
              }`}
            >
              {p.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-bg/30 text-bg' : 'bg-accent/20 text-accent'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legenda */}
      <p className="text-foreground-muted text-xs mb-3">
        Arraste as mídias livremente no canvas. O fundo mostra a página real do site.
      </p>

      {/* Canvas + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="rounded-xl border border-bg-hover overflow-auto relative"
          style={{ maxHeight: '75vh', background: '#111' }}
        >
          {/* Área de posicionamento */}
          <div
            onClick={handleCanvasClick}
            style={{ position: 'relative', width: canvasW, height: canvasH, overflow: 'hidden' }}
          >
            {/* ── Iframe da página real (fundo de referência, sem interação) ── */}
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: canvasW, height: canvasH,
              overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
            }}>
              {!iframeLoaded && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: '#111', color: 'rgba(180,156,253,0.5)', fontSize: 12,
                }}>
                  Carregando preview…
                </div>
              )}
              <iframe
                key={selectedPage}
                src={`${selectedPage}?noOverlays=1`}
                onLoad={() => setIframeLoaded(true)}
                style={{
                  width: NATIVE_W,
                  height: NATIVE_H,
                  border: 'none',
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                  display: 'block',
                  opacity: iframeLoaded ? 1 : 0,
                  transition: 'opacity 0.3s',
                }}
              />
            </div>

            {/* Grade de referência (leve, sobre o iframe) */}
            <div
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                backgroundImage: `
                  linear-gradient(rgba(180,156,253,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(180,156,253,0.04) 1px, transparent 1px)
                `,
                backgroundSize: `${80 * scale}px ${80 * scale}px`,
              }}
            />

            {/* Régua de referência (pixels Y nativos) */}
            {[500, 1000, 1500, 2000, 2500, 3000].map((yNative) => (
              <div
                key={yNative}
                style={{
                  position: 'absolute',
                  top: yNative * scale,
                  left: 0, right: 0, height: 1,
                  background: 'rgba(180,156,253,0.25)',
                  pointerEvents: 'none', zIndex: 2,
                }}
              >
                <span style={{ position: 'absolute', left: 4, top: -10, fontSize: 9, color: 'rgba(180,156,253,0.6)', userSelect: 'none' }}>
                  y={yNative}px
                </span>
              </div>
            ))}

            {/* Items */}
            {pageOverlays.map((item) => {
              const isSpotify = item.type === 'spotify'
              const ar = isSpotify ? 0 : (aspectRatios[item.src] || 1)
              const spotifyHeightPx = isSpotify ? (item.height ?? 152) * scale : 0
              const { x, y, w, h } = toCanvasPos(item, canvasW, canvasH, ar)
              const finalH = isSpotify ? spotifyHeightPx : h
              const isSelected = selectedId === item.id

              return (
                <Rnd
                  key={item.id}
                  position={{ x, y }}
                  size={{ width: w, height: finalH }}
                  lockAspectRatio={isSpotify ? false : (ar > 0 ? ar : false)}
                  enableResizing={{
                    topLeft: !isSpotify, topRight: !isSpotify, bottomLeft: !isSpotify, bottomRight: !isSpotify,
                    top: false, bottom: isSpotify, left: false, right: isSpotify,
                  }}
                  bounds="parent"
                  onDragStop={(_e, d) => {
                    const pos = fromCanvasPos(d.x, d.y, item, canvasW, canvasH, w, finalH)
                    updateOverlay(item.id, pos)
                  }}
                  onResizeStop={(_e, _dir, ref, _delta, pos) => {
                    const newW = (ref.offsetWidth / canvasW) * 100
                    const patch: Partial<typeof item> = { width: newW }
                    if (isSpotify) patch.height = Math.round(ref.offsetHeight / scale)
                    const newPos = fromCanvasPos(pos.x, pos.y, item, canvasW, canvasH, ref.offsetWidth, ref.offsetHeight)
                    updateOverlay(item.id, { ...newPos, ...patch })
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setSelectedId(item.id)
                  }}
                  style={{
                    zIndex: item.zIndex + 10,
                    outline: isSelected ? '2px solid #b49cfd' : '1px dashed rgba(180,156,253,0.35)',
                    outlineOffset: '2px',
                    cursor: 'move',
                    opacity: item.visible ? 1 : 0.35,
                  }}
                >
                  <div style={{ width: '100%', height: '100%', transform: isSpotify ? undefined : `rotate(${item.rotation}deg)` }}>
                    {isSpotify ? (
                      /* Placeholder Spotify no canvas (evita conflitos de mouse com Rnd) */
                      <div style={{
                        width: '100%', height: '100%',
                        background: '#121212',
                        borderRadius: 8,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 4, overflow: 'hidden', pointerEvents: 'none',
                      }}>
                        <svg viewBox="0 0 24 24" width={Math.max(16, w * 0.15)} fill="#1DB954">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.241-3.021-1.858-6.832-2.278-11.322-1.237-.422.1-.851-.16-.949-.584-.1-.421.16-.85.584-.949 4.91-1.121 9.121-.641 12.511 1.431.371.24.49.721.241 1.1h.036zm1.471-3.27c-.301.459-.917.6-1.379.301-3.459-2.131-8.729-2.75-12.812-1.509-.518.16-1.06-.129-1.221-.648-.159-.52.13-1.061.649-1.221 4.671-1.42 10.48-.729 14.47 1.72.461.3.601.916.3 1.378l-.007-.021zm.129-3.4c-4.149-2.469-11-2.699-14.96-1.492-.638.189-1.31-.169-1.5-.809-.189-.638.17-1.31.811-1.499 4.55-1.381 12.119-1.111 16.899 1.73.571.34.76 1.079.421 1.65-.34.57-1.08.76-1.65.42l-.021-.001z"/>
                        </svg>
                        <span style={{ color: '#1DB954', fontSize: Math.max(8, w * 0.04), fontFamily: 'monospace', whiteSpace: 'nowrap', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Spotify Player
                        </span>
                      </div>
                    ) : item.type === 'video' ? (
                      <video
                        src={item.src}
                        autoPlay loop muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.src}
                        alt=""
                        draggable={false}
                        onLoad={(e) => {
                          const img = e.currentTarget
                          if (img.naturalWidth && img.naturalHeight) {
                            registerAspectRatio(item.src, img.naturalWidth / img.naturalHeight)
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
                      />
                    )}
                  </div>

                  {/* Label ao selecionar */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -20, left: 0,
                      background: '#b49cfd', color: '#0f0f0f',
                      fontSize: 9, padding: '1px 5px', borderRadius: 3,
                      whiteSpace: 'nowrap', pointerEvents: 'none',
                    }}>
                      {isSpotify ? 'Spotify' : item.src.split('/').pop()} · z{item.zIndex}
                    </div>
                  )}
                </Rnd>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upload de imagem/vídeo */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <p className="text-foreground-muted text-xs uppercase tracking-wider mb-3">Adicionar imagem / vídeo</p>
            <ImageUploader
              onUpload={(result) => addOverlay(result.src)}
              targetDir="overlays"
              accept="image/*,video/mp4"
              label="Upload de imagem ou vídeo"
            />
          </div>

          {/* Spotify embed */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <p className="text-foreground-muted text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" width={14} fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.371-.721.49-1.101.241-3.021-1.858-6.832-2.278-11.322-1.237-.422.1-.851-.16-.949-.584-.1-.421.16-.85.584-.949 4.91-1.121 9.121-.641 12.511 1.431.371.24.49.721.241 1.1h.036zm1.471-3.27c-.301.459-.917.6-1.379.301-3.459-2.131-8.729-2.75-12.812-1.509-.518.16-1.06-.129-1.221-.648-.159-.52.13-1.061.649-1.221 4.671-1.42 10.48-.729 14.47 1.72.461.3.601.916.3 1.378l-.007-.021zm.129-3.4c-4.149-2.469-11-2.699-14.96-1.492-.638.189-1.31-.169-1.5-.809-.189-.638.17-1.31.811-1.499 4.55-1.381 12.119-1.111 16.899 1.73.571.34.76 1.079.421 1.65-.34.57-1.08.76-1.65.42l-.021-.001z"/></svg>
              Adicionar Spotify
            </p>
            <input
              type="text"
              value={spotifyInput}
              onChange={(e) => { setSpotifyInput(e.target.value); setSpotifyError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') addSpotifyOverlay() }}
              placeholder="Cole o link do Spotify aqui…"
              className="w-full bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted focus:outline-none focus:border-accent/50 mb-2"
            />
            {spotifyError && <p className="text-red-400 text-xs mb-2">{spotifyError}</p>}
            <button
              onClick={addSpotifyOverlay}
              disabled={!spotifyInput.trim()}
              className="px-4 py-2 bg-[#1DB954] text-black text-xs font-semibold rounded-lg hover:bg-[#1ed760] disabled:opacity-40 transition-colors"
            >
              + Adicionar player
            </button>
            <p className="text-foreground-muted text-[10px] mt-2">
              Funciona com playlists, álbuns, tracks, podcasts e artistas do Spotify.
            </p>
          </div>

          {/* Lista */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <p className="text-foreground-muted text-xs uppercase tracking-wider mb-3">
              Mídias em {PAGES.find((p) => p.route === selectedPage)?.label} ({pageOverlays.length})
            </p>
            {pageOverlays.length === 0 ? (
              <p className="text-foreground-muted text-xs">Nenhuma mídia. Faça upload acima.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {pageOverlays.map((o) => {
                  const filename = o.src.split('/').pop() || o.src
                  return (
                    <div
                      key={o.id}
                      onClick={() => setSelectedId(o.id)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                        selectedId === o.id ? 'bg-accent/10 border border-accent/40' : 'bg-bg border border-bg-hover hover:border-accent/30'
                      }`}
                    >
                      <div className="w-9 h-9 flex-shrink-0 bg-black/40 rounded overflow-hidden flex items-center justify-center">
                        {o.type === 'video' ? (
                          <video src={o.src} muted loop autoPlay playsInline className="w-full h-full object-contain" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.src} alt="" className="w-full h-full object-contain" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs truncate" title={filename}>{filename}</p>
                        <p className="text-foreground-muted text-[10px]">z:{o.zIndex} · {o.width.toFixed(1)}%</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Btn title={o.visible ? 'Esconder' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); updateOverlay(o.id, { visible: !o.visible }) }}>
                          {o.visible ? '👁' : '🚫'}
                        </Btn>
                        <Btn title="Z+1" onClick={(e) => { e.stopPropagation(); moveZ(o.id, 1) }}>↑</Btn>
                        <Btn title="Z-1" onClick={(e) => { e.stopPropagation(); moveZ(o.id, -1) }}>↓</Btn>
                        <Btn danger title="Remover" onClick={(e) => { e.stopPropagation(); if (confirm(`Remover ${filename}?`)) deleteOverlay(o.id) }}>🗑</Btn>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Propriedades */}
          {selected ? (
            <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
              <p className="text-foreground-muted text-xs uppercase tracking-wider mb-3">Propriedades</p>
              <OverlayPropsPanel
                overlay={selected}
                onChange={(patch) => updateOverlay(selected.id, patch)}
              />
            </div>
          ) : (
            <div className="bg-bg border border-dashed border-bg-hover rounded-xl p-4 text-center">
              <p className="text-foreground-muted text-xs">Clique numa mídia para editar suas propriedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Btn({ children, onClick, title, danger }: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-6 h-6 flex items-center justify-center rounded text-[11px] transition-colors ${
        danger ? 'text-red-400 hover:bg-red-400/20' : 'text-foreground-muted hover:text-foreground hover:bg-bg-hover'
      }`}
    >
      {children}
    </button>
  )
}
