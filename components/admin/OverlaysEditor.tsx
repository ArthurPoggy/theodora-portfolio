import { useEffect, useRef, useState } from 'react'
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

const VIEWPORTS: { label: string; width: number }[] = [
  { label: '🖥 Desktop 1440', width: 1440 },
  { label: '📱 Tablet 768', width: 768 },
  { label: '📲 Mobile 375', width: 375 },
]

function detectMediaType(src: string): 'image' | 'video' {
  return /\.mp4$/i.test(src) ? 'video' : 'image'
}

function newOverlay(src: string): MediaOverlay {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

export default function OverlaysEditor({ data, onChange }: OverlaysEditorProps) {
  const [selectedPage, setSelectedPage] = useState<string>('/')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(1440)
  const [iframeReady, setIframeReady] = useState(false)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const dataRef = useRef<OverlaysData>(data)
  const fromIframeRef = useRef(false)
  dataRef.current = data

  const pageOverlays = data[selectedPage] || []
  const selected = pageOverlays.find((o) => o.id === selectedId) || null

  // ── Mutações no estado de overlays ─────────────────────────────────
  function setPageOverlays(list: MediaOverlay[]) {
    const next = { ...dataRef.current }
    if (list.length === 0) {
      delete next[selectedPage]
    } else {
      next[selectedPage] = list
    }
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

  function moveZ(id: string, direction: 1 | -1) {
    const overlay = (dataRef.current[selectedPage] || []).find((o) => o.id === id)
    if (!overlay) return
    updateOverlay(id, { zIndex: Math.max(2, Math.min(29, overlay.zIndex + direction)) })
  }

  // ── postMessage: iframe → admin ────────────────────────────────────
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      const msg = e.data
      if (!msg || typeof msg !== 'object') return

      if (msg.type === 'overlay-iframe-ready') {
        setIframeReady(true)
        // Envia estado atual pro iframe
        sendOverlaysToIframe(dataRef.current)
      } else if (msg.type === 'overlay-update' && msg.id && msg.patch) {
        fromIframeRef.current = true
        updateOverlay(msg.id, msg.patch)
      } else if (msg.type === 'overlay-select') {
        setSelectedId(msg.id || null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage])

  // ── Sync admin → iframe quando state muda (debounced) ─────────────
  useEffect(() => {
    if (fromIframeRef.current) {
      fromIframeRef.current = false
      return
    }
    if (!iframeReady) return
    const t = setTimeout(() => {
      sendOverlaysToIframe(data)
    }, 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, iframeReady])

  // Quando seleção muda, sincroniza com iframe
  useEffect(() => {
    if (!iframeReady) return
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'set-selection', id: selectedId },
      window.location.origin
    )
  }, [selectedId, iframeReady])

  // Quando muda de página, reset iframe ready
  useEffect(() => {
    setIframeReady(false)
    setSelectedId(null)
  }, [selectedPage])

  function sendOverlaysToIframe(d: OverlaysData) {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'set-overlays', data: d },
      window.location.origin
    )
  }

  return (
    <div>
      {/* Page selector + viewport simulator */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div className="flex-1 min-w-[300px]">
          <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">Página</label>
          <div className="flex flex-wrap gap-2">
            {PAGES.map((p) => {
              const count = data[p.route]?.length || 0
              const active = selectedPage === p.route
              return (
                <button
                  key={p.route}
                  onClick={() => setSelectedPage(p.route)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    active ? 'bg-accent text-bg' : 'bg-bg-card border border-bg-hover text-foreground-muted hover:border-accent/40'
                  }`}
                >
                  <span>{p.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-bg/30 text-bg' : 'bg-accent/20 text-accent'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">Simular viewport</label>
          <div className="flex gap-1">
            {VIEWPORTS.map((v) => (
              <button
                key={v.width}
                onClick={() => setViewportWidth(v.width)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewportWidth === v.width ? 'bg-accent text-bg' : 'bg-bg-card border border-bg-hover text-foreground-muted hover:border-accent/40'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Split: iframe + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        {/* Iframe container */}
        <div className="bg-bg-card border border-bg-hover rounded-xl overflow-hidden">
          <div className="bg-bg px-3 py-1.5 text-foreground-muted text-xs flex items-center justify-between border-b border-bg-hover">
            <span className="font-mono">{selectedPage}?adminEdit=1</span>
            <span className="text-[10px]">{viewportWidth}px {iframeReady ? '● conectado' : '○ carregando…'}</span>
          </div>
          <div className="overflow-auto bg-black/40" style={{ maxHeight: '70vh' }}>
            <iframe
              ref={iframeRef}
              key={selectedPage}
              src={`${selectedPage}?adminEdit=1`}
              style={{ width: viewportWidth, height: '70vh', border: 'none', display: 'block', background: 'white' }}
              title="Preview do site para edição"
            />
          </div>
        </div>

        {/* Sidebar: lista + props */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <ImageUploader
              onUpload={(src) => addOverlay(src)}
              targetDir="overlays"
              accept="image/*,video/mp4"
              label="Adicionar mídia"
            />
          </div>

          {/* Lista de overlays */}
          <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
            <h3 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-3">
              Mídias em {PAGES.find((p) => p.route === selectedPage)?.label} ({pageOverlays.length})
            </h3>
            {pageOverlays.length === 0 ? (
              <p className="text-foreground-muted text-xs">Nenhuma mídia. Adicione com o botão acima.</p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {pageOverlays.map((o) => (
                  <OverlayRow
                    key={o.id}
                    overlay={o}
                    selected={selectedId === o.id}
                    onSelect={() => setSelectedId(o.id)}
                    onDelete={() => deleteOverlay(o.id)}
                    onToggleVisible={() => updateOverlay(o.id, { visible: !o.visible })}
                    onZUp={() => moveZ(o.id, 1)}
                    onZDown={() => moveZ(o.id, -1)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Props panel */}
          {selected ? (
            <div className="bg-bg-card border border-bg-hover rounded-xl p-4">
              <h3 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-3">Propriedades</h3>
              <OverlayPropsPanel
                overlay={selected}
                onChange={(patch) => updateOverlay(selected.id, patch)}
              />
            </div>
          ) : (
            <div className="bg-bg border border-dashed border-bg-hover rounded-xl p-4 text-center">
              <p className="text-foreground-muted text-xs">Clique numa mídia (lista ou iframe) para editar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface OverlayRowProps {
  overlay: MediaOverlay
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onToggleVisible: () => void
  onZUp: () => void
  onZDown: () => void
}

function OverlayRow({ overlay, selected, onSelect, onDelete, onToggleVisible, onZUp, onZDown }: OverlayRowProps) {
  const filename = overlay.src.split('/').pop() || overlay.src
  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-accent/10 border border-accent/40' : 'bg-bg border border-bg-hover hover:border-accent/30'
      }`}
    >
      <div className="w-9 h-9 flex-shrink-0 bg-black/40 rounded overflow-hidden flex items-center justify-center">
        {overlay.type === 'video' ? (
          <video src={overlay.src} muted loop autoPlay playsInline className="w-full h-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={overlay.src} alt="" className="w-full h-full object-contain" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs truncate" title={filename}>{filename}</p>
        <p className="text-foreground-muted text-[10px]">z:{overlay.zIndex} r:{overlay.rotation}°</p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <IconBtn title={overlay.visible ? 'Esconder' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); onToggleVisible() }}>
          {overlay.visible ? '👁' : '🚫'}
        </IconBtn>
        <IconBtn title="Z+1" onClick={(e) => { e.stopPropagation(); onZUp() }}>↑</IconBtn>
        <IconBtn title="Z-1" onClick={(e) => { e.stopPropagation(); onZDown() }}>↓</IconBtn>
        <IconBtn title="Remover" onClick={(e) => { e.stopPropagation(); if (confirm(`Remover ${filename}?`)) onDelete() }} danger>🗑</IconBtn>
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean }) {
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
