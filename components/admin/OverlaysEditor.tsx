import { useRef, useState, useEffect, useCallback } from 'react'
import { Rnd } from 'react-rnd'
import type { OverlaysData, MediaOverlay } from '@/types/cms'
import ImageUploader from './ImageUploader'
import OverlayPropsPanel from './OverlayPropsPanel'

interface OverlaysEditorProps {
  data: OverlaysData
  onChange: (data: OverlaysData) => void
}

const PAGES: { route: string; label: string }[] = [
  { route: '/', label: 'Home' },
  { route: '/sobre', label: 'Sobre' },
  { route: '/modelagem-3d', label: 'Modelagem 3D' },
  { route: '/ilustracoes', label: 'Ilustrações' },
  { route: '/concept-art', label: 'Concept Art' },
  { route: '/animacoes', label: 'Animações' },
  { route: '/branding', label: 'Branding' },
  { route: '/encomendados', label: 'Encomendados' },
  { route: '/nsfw', label: 'NSFW' },
  { route: '/trabalhos-fisicos', label: 'Trabalhos Físicos' },
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
  // src -> aspect ratio (natural)
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({})

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
              const ar = aspectRatios[item.src] || 1
              const { x, y, w, h } = toCanvasPos(item, canvasW, canvasH, ar)
              const isSelected = selectedId === item.id

              return (
                <Rnd
                  key={item.id}
                  position={{ x, y }}
                  size={{ width: w, height: h }}
                  lockAspectRatio={ar > 0 ? ar : false}
                  enableResizing={{
                    topLeft: true, topRight: true, bottomLeft: true, bottomRight: true,
                    top: false, bottom: false, left: false, right: false,
                  }}
                  bounds="parent"
                  onDragStop={(_e, d) => {
                    const pos = fromCanvasPos(d.x, d.y, item, canvasW, canvasH, w, h)
                    updateOverlay(item.id, pos)
                  }}
                  onResizeStop={(_e, _dir, ref, _delta, pos) => {
                    const newW = (ref.offsetWidth / canvasW) * 100
                    const newPos = fromCanvasPos(pos.x, pos.y, item, canvasW, canvasH, ref.offsetWidth, ref.offsetHeight)
                    updateOverlay(item.id, { ...newPos, width: newW })
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    setSelectedId(item.id)
                  }}
                  style={{
                    zIndex: item.zIndex + 10, // garante que ficam acima do iframe (zIndex 0)
                    outline: isSelected ? '2px solid #b49cfd' : '1px dashed rgba(180,156,253,0.35)',
                    outlineOffset: '2px',
                    cursor: 'move',
                    opacity: item.visible ? 1 : 0.35,
                  }}
                >
                  <div style={{ width: '100%', height: '100%', transform: `rotate(${item.rotation}deg)` }}>
                    {item.type === 'video' ? (
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
                      {item.src.split('/').pop()} · z{item.zIndex}
                    </div>
                  )}
                </Rnd>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <p className="text-foreground-muted text-xs uppercase tracking-wider mb-3">Adicionar mídia</p>
            <ImageUploader
              onUpload={(src) => addOverlay(src)}
              targetDir="overlays"
              accept="image/*,video/mp4"
              label="Upload de imagem ou vídeo"
            />
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
