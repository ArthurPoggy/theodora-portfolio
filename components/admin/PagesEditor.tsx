import { useState } from 'react'
import type { DynamicPage, PagesData, GalleryImage, GalleryTab, VideoItem } from '@/types/cms'
import GalleryEditor from './GalleryEditor'
import VideoEditor from './VideoEditor'
import { useDragList } from '@/hooks/useDragList'

interface PagesEditorProps {
  pages: PagesData
  onChange: (pages: PagesData) => void
}

const RESERVED_SLUGS = new Set([
  '', 'admin', 'sobre', 'contato', 'stats',
  'api', '_app', '_document', '_next',
])

function slugify(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PagesEditor({ pages, onChange }: PagesEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  // Mantém a ordem visual sincronizada com o campo `order`
  const onReorder = (next: PagesData) => onChange(next.map((p, i) => ({ ...p, order: i + 1 })))
  const { dragIdx, overIdx, dragProps } = useDragList(pages, onReorder)

  function update(idx: number, patch: Partial<DynamicPage>) {
    onChange(pages.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  function remove(idx: number) {
    const page = pages[idx]
    if (!page) return
    if (!confirm(`Excluir página "${page.label}"? Esta ação remove a rota /${page.slug} do site.`)) return
    onChange(pages.filter((_, i) => i !== idx))
    if (expandedIdx === idx) setExpandedIdx(null)
  }

  function add() {
    const order = pages.length > 0 ? Math.max(...pages.map((p) => p.order || 0)) + 1 : 1
    const baseLabel = 'Nova página'
    let label = baseLabel
    let n = 2
    while (pages.some((p) => p.label === label)) { label = `${baseLabel} ${n++}` }
    const slug = slugify(label) || `pagina-${Date.now()}`
    onChange([...pages, {
      slug, label, type: 'gallery',
      isNsfw: false, hideFromNav: false, order,
      description: '', images: [],
    }])
    setExpandedIdx(pages.length)
  }

  function slugIsValid(slug: string, idx: number): { ok: boolean; reason?: string } {
    if (!slug) return { ok: false, reason: 'Slug obrigatório' }
    if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, reason: 'Use apenas letras minúsculas, números e hífens' }
    if (RESERVED_SLUGS.has(slug)) return { ok: false, reason: 'Slug reservado' }
    if (pages.some((p, i) => i !== idx && p.slug === slug)) return { ok: false, reason: 'Slug já em uso' }
    return { ok: true }
  }

  return (
    <div className="space-y-3">
      <p className="text-foreground-muted text-xs italic">
        Arraste o ícone <span className="font-mono">⠿</span> para reordenar. A ordem define como o menu aparece no site.
      </p>

      {pages.map((page, idx) => {
        const isExpanded = expandedIdx === idx
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
        const slugCheck = slugIsValid(page.slug, idx)

        return (
          <div
            key={idx}
            className={`bg-bg-card border rounded-xl transition-all ${
              isOver ? 'border-accent border-2' : 'border-bg-hover'
            } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
          >
            <div
              {...dragProps(idx)}
              className="flex items-center gap-3 p-3"
            >
              <span className="cursor-grab text-foreground-muted text-base select-none flex-shrink-0" title="Arraste para reordenar">⠿</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold truncate">{page.label || '(sem nome)'}</p>
                <p className="text-foreground-muted text-xs truncate">
                  /{page.slug} · {page.type}
                  {page.isNsfw && <span className="ml-2 text-red-400">NSFW</span>}
                  {page.hideFromNav && <span className="ml-2 text-foreground-muted">oculta no menu</span>}
                </p>
              </div>
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="text-xs px-3 py-1.5 border border-accent/40 text-accent rounded hover:bg-accent/10"
              >
                {isExpanded ? 'Fechar' : 'Editar'}
              </button>
              <button
                onClick={() => remove(idx)}
                className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10"
                title="Excluir página"
              >
                ✕
              </button>
            </div>

            {isExpanded && (
              <div className="p-4 border-t border-bg-hover space-y-4">
                {/* Metadados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-1">Título</label>
                    <input
                      type="text"
                      value={page.label}
                      onChange={(e) => {
                        const newLabel = e.target.value
                        const autoSlug = !page.slug || page.slug === slugify(page.label)
                        update(idx, autoSlug
                          ? { label: newLabel, slug: slugify(newLabel) }
                          : { label: newLabel })
                      }}
                      className="w-full bg-bg border border-bg-hover rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-1">Slug (URL)</label>
                    <input
                      type="text"
                      value={page.slug}
                      onChange={(e) => update(idx, { slug: e.target.value.toLowerCase() })}
                      className={`w-full bg-bg border rounded px-3 py-2 text-sm text-foreground focus:outline-none ${
                        slugCheck.ok ? 'border-bg-hover focus:border-accent/50' : 'border-red-500/50'
                      }`}
                    />
                    {!slugCheck.ok && <p className="text-red-400 text-xs mt-1">{slugCheck.reason}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-1">Descrição (SEO)</label>
                  <input
                    type="text"
                    value={page.description || ''}
                    onChange={(e) => update(idx, { description: e.target.value })}
                    className="w-full bg-bg border border-bg-hover rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
                  />
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-1">Tipo</label>
                    <select
                      value={page.type}
                      onChange={(e) => update(idx, { type: e.target.value as DynamicPage['type'] })}
                      className="bg-bg border border-bg-hover rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
                    >
                      <option value="gallery">Galeria simples</option>
                      <option value="tabs-gallery">Galeria com abas</option>
                      <option value="animations">Animações (GIFs + Vídeos)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={page.isNsfw}
                      onChange={(e) => update(idx, { isNsfw: e.target.checked })}
                    />
                    Conteúdo NSFW (gate de idade)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={page.hideFromNav}
                      onChange={(e) => update(idx, { hideFromNav: e.target.checked })}
                    />
                    Ocultar do menu
                  </label>
                </div>

                {/* Editor de conteúdo por tipo */}
                {page.type === 'gallery' && (
                  <div>
                    <h4 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-2">Imagens</h4>
                    <GalleryEditor
                      key={`gallery-${idx}`}
                      targetDir={page.slug || 'novo'}
                      images={page.images || []}
                      onChange={(images: GalleryImage[]) => update(idx, { images })}
                    />
                  </div>
                )}

                {page.type === 'tabs-gallery' && (
                  <TabsGalleryEditor
                    tabs={page.tabs || []}
                    slug={page.slug}
                    onChange={(tabs: GalleryTab[]) => update(idx, { tabs })}
                  />
                )}

                {page.type === 'animations' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-2">GIFs</h4>
                      <GalleryEditor
                        key={`gifs-${idx}`}
                        targetDir={`${page.slug}-gifs`}
                        images={page.gifs || []}
                        onChange={(gifs: GalleryImage[]) => update(idx, { gifs })}
                      />
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-2">Vídeos</h4>
                      <VideoEditor
                        videos={page.videos || []}
                        onChange={(videos: VideoItem[]) => update(idx, { videos })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button
        onClick={add}
        className="w-full text-accent text-sm border border-dashed border-accent/40 rounded-xl px-4 py-3 hover:bg-accent/10 transition-colors"
      >
        + Nova página
      </button>
    </div>
  )
}

interface TabsGalleryEditorProps {
  tabs: GalleryTab[]
  slug: string
  onChange: (tabs: GalleryTab[]) => void
}

function TabsGalleryEditor({ tabs, slug, onChange }: TabsGalleryEditorProps) {
  const [active, setActive] = useState<string>(tabs[0]?.key || '')

  function addTab() {
    const baseKey = 'aba'
    let n = tabs.length + 1
    while (tabs.some((t) => t.key === `${baseKey}-${n}`)) n++
    const key = `${baseKey}-${n}`
    const next = [...tabs, { key, label: `Aba ${n}`, images: [] }]
    onChange(next)
    setActive(key)
  }

  function updateTab(key: string, patch: Partial<GalleryTab>) {
    onChange(tabs.map((t) => (t.key === key ? { ...t, ...patch } : t)))
  }

  function removeTab(key: string) {
    if (tabs.length <= 1) { alert('A galeria precisa ter ao menos uma aba.'); return }
    if (!confirm('Excluir esta aba?')) return
    const next = tabs.filter((t) => t.key !== key)
    onChange(next)
    if (active === key) setActive(next[0]?.key || '')
  }

  const activeTab = tabs.find((t) => t.key === active) || tabs[0]

  return (
    <div>
      <h4 className="text-foreground font-semibold text-xs uppercase tracking-wider mb-2">Abas</h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              active === t.key ? 'bg-accent text-bg' : 'border border-accent/30 text-accent hover:bg-accent/10'
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={addTab}
          className="px-3 py-1.5 rounded text-xs border border-dashed border-accent/40 text-accent hover:bg-accent/10"
        >
          + Aba
        </button>
      </div>

      {activeTab && (
        <div className="space-y-3 bg-bg border border-bg-hover rounded-xl p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={activeTab.label}
              onChange={(e) => updateTab(activeTab.key, { label: e.target.value })}
              placeholder="Nome da aba"
              className="bg-bg-card border border-bg-hover rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent/50"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={activeTab.key}
                onChange={(e) => updateTab(activeTab.key, { key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="key (interna)"
                className="flex-1 bg-bg-card border border-bg-hover rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent/50"
              />
              <button
                onClick={() => removeTab(activeTab.key)}
                className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10"
              >
                Excluir aba
              </button>
            </div>
          </div>
          <GalleryEditor
            key={`${slug}-${activeTab.key}`}
            targetDir={`${slug}-${activeTab.key}`}
            images={activeTab.images}
            onChange={(images: GalleryImage[]) => updateTab(activeTab.key, { images })}
          />
        </div>
      )}
    </div>
  )
}
