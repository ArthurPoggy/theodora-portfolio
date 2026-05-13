import { useEffect, useState } from 'react'
import type { MarqueeItem, GalleryImage, DynamicPage } from '@/types/cms'
import ImageUploader from './ImageUploader'
import { useDragList } from '@/hooks/useDragList'
import { normalizeMediaSrc } from '@/lib/imagekit'

interface MarqueeEditorProps {
  items: MarqueeItem[]
  onChange: (items: MarqueeItem[]) => void
}

// Páginas especiais sempre disponíveis (não vêm do CMS dinâmico)
const FIXED_PAGES = [
  { href: '/', label: 'Home' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
]

export default function MarqueeEditor({ items, onChange }: MarqueeEditorProps) {
  const { dragIdx, overIdx, dragProps } = useDragList(items, onChange)
  const [pageOptions, setPageOptions] = useState<{ href: string; label: string }[]>(FIXED_PAGES)

  useEffect(() => {
    fetch('/api/public/pages')
      .then((r) => r.ok ? r.json() as Promise<DynamicPage[]> : [])
      .then((pages) => {
        const dynamic = (Array.isArray(pages) ? pages : [])
          .filter((p) => !p.hideFromNav)
          .sort((a, b) => a.order - b.order)
          .map((p) => ({ href: `/${p.slug}`, label: p.label }))
        setPageOptions([...FIXED_PAGES, ...dynamic])
      })
      .catch(() => { /* mantém só FIXED_PAGES */ })
  }, [])

  function update(idx: number, patch: Partial<MarqueeItem>) {
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  function handleUpload(result: GalleryImage) {
    onChange([
      ...items,
      { src: result.src, alt: result.alt || '', href: '/', category: '' },
    ])
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-foreground-muted text-sm italic">Nenhum item ainda. Adicione abaixo.</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((it, idx) => {
          const isDragging = dragIdx === idx
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
          return (
            <div
              key={idx}
              {...dragProps(idx)}
              className={`flex gap-3 items-start bg-bg-card border rounded-xl p-3 transition-all ${
                isOver ? 'border-accent border-2' : 'border-bg-hover'
              } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            >
              <span className="cursor-grab text-foreground-muted text-base select-none flex-shrink-0 mt-1" title="Arraste para reordenar">⠿</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeMediaSrc(it.src)}
                alt={it.alt}
                className="w-16 h-16 rounded-lg object-cover border border-bg-hover flex-shrink-0"
              />
              <div className="flex-1 space-y-1.5 min-w-0">
                <input
                  type="text"
                  value={it.alt}
                  onChange={(e) => update(idx, { alt: e.target.value })}
                  placeholder="Texto alternativo"
                  className="w-full bg-bg border border-bg-hover rounded px-2 py-1 text-xs text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
                />
                <input
                  type="text"
                  value={it.category}
                  onChange={(e) => update(idx, { category: e.target.value })}
                  placeholder="Categoria (ex: Modelagem 3D)"
                  className="w-full bg-bg border border-bg-hover rounded px-2 py-1 text-xs text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
                />
                <select
                  value={it.href}
                  onChange={(e) => update(idx, { href: e.target.value })}
                  className="w-full bg-bg border border-bg-hover rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent/50"
                >
                  {/* Se o href atual não está nas opções, mantém para não perder a referência */}
                  {pageOptions.find((p) => p.href === it.href) ? null : (
                    <option value={it.href}>{it.href}</option>
                  )}
                  {pageOptions.map((p) => (
                    <option key={p.href} value={p.href}>{p.label} — {p.href}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => remove(idx)}
                className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10 flex-shrink-0"
                title="Remover"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
      <ImageUploader onUpload={handleUpload} targetDir="marquee" label="Adicionar item ao carrossel" />
    </div>
  )
}
