import { useState } from 'react'
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

  const pageOverlays = data[selectedPage] || []
  const selected = pageOverlays.find((o) => o.id === selectedId) || null

  function setPageOverlays(list: MediaOverlay[]) {
    const next = { ...data }
    if (list.length === 0) {
      delete next[selectedPage]
    } else {
      next[selectedPage] = list
    }
    onChange(next)
  }

  function updateOverlay(id: string, patch: Partial<MediaOverlay>) {
    setPageOverlays(pageOverlays.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function deleteOverlay(id: string) {
    setPageOverlays(pageOverlays.filter((o) => o.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function addOverlay(src: string) {
    const created = newOverlay(src)
    setPageOverlays([...pageOverlays, created])
    setSelectedId(created.id)
  }

  function moveZ(id: string, direction: 1 | -1) {
    const overlay = pageOverlays.find((o) => o.id === id)
    if (!overlay) return
    const newZ = Math.max(2, Math.min(29, overlay.zIndex + direction))
    updateOverlay(id, { zIndex: newZ })
  }

  return (
    <div>
      {/* Page selector */}
      <div className="mb-6">
        <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-2">Página</label>
        <div className="flex flex-wrap gap-2">
          {PAGES.map((p) => {
            const count = data[p.route]?.length || 0
            const active = selectedPage === p.route
            return (
              <button
                key={p.route}
                onClick={() => {
                  setSelectedPage(p.route)
                  setSelectedId(null)
                }}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Esquerda: lista + upload */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider">Mídias em {PAGES.find((p) => p.route === selectedPage)?.label}</h3>
          </div>

          <div className="mb-4">
            <ImageUploader
              onUpload={(src) => addOverlay(src)}
              targetDir="overlays"
              accept="image/*,video/mp4"
              label="Adicionar mídia"
            />
          </div>

          {pageOverlays.length === 0 ? (
            <div className="bg-bg border border-dashed border-bg-hover rounded-lg p-6 text-center">
              <p className="text-foreground-muted text-sm">Nenhuma mídia nesta página.</p>
              <p className="text-foreground-muted text-xs mt-1">Use o botão acima para adicionar.</p>
            </div>
          ) : (
            <div className="space-y-2">
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

        {/* Direita: painel de propriedades */}
        <div>
          <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">Propriedades</h3>
          {selected ? (
            <div className="bg-bg border border-bg-hover rounded-xl p-5">
              <OverlayPropsPanel
                overlay={selected}
                onChange={(patch) => updateOverlay(selected.id, patch)}
              />
            </div>
          ) : (
            <div className="bg-bg border border-dashed border-bg-hover rounded-xl p-6 text-center">
              <p className="text-foreground-muted text-sm">Selecione uma mídia da lista para editar.</p>
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
      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-accent/10 border border-accent/40' : 'bg-bg border border-bg-hover hover:border-accent/30'
      }`}
    >
      {/* Thumb */}
      <div className="w-12 h-12 flex-shrink-0 bg-black/40 rounded overflow-hidden flex items-center justify-center">
        {overlay.type === 'video' ? (
          <video src={overlay.src} muted loop autoPlay playsInline className="w-full h-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={overlay.src} alt="" className="w-full h-full object-contain" />
        )}
      </div>

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm truncate" title={filename}>{filename}</p>
        <p className="text-foreground-muted text-[10px] mt-0.5">
          x:{overlay.x}% y:{overlay.y}px w:{overlay.width}% z:{overlay.zIndex}
          {overlay.rotation !== 0 && ` r:${overlay.rotation}°`}
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconBtn title={overlay.visible ? 'Esconder' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); onToggleVisible() }}>
          {overlay.visible ? '👁' : '🚫'}
        </IconBtn>
        <IconBtn title="Trazer para frente (z+1)" onClick={(e) => { e.stopPropagation(); onZUp() }}>↑</IconBtn>
        <IconBtn title="Mandar para trás (z-1)" onClick={(e) => { e.stopPropagation(); onZDown() }}>↓</IconBtn>
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
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-400/20'
          : 'text-foreground-muted hover:text-foreground hover:bg-bg-hover'
      }`}
    >
      {children}
    </button>
  )
}
