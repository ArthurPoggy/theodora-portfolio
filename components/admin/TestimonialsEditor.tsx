import type { Testimonial } from '@/types/cms'
import { useDragList } from '@/hooks/useDragList'

interface TestimonialsEditorProps {
  testimonials: Testimonial[]
  onChange: (testimonials: Testimonial[]) => void
}

export default function TestimonialsEditor({ testimonials, onChange }: TestimonialsEditorProps) {
  const { dragIdx, overIdx, dragProps } = useDragList(testimonials, onChange)

  function update(idx: number, patch: Partial<Testimonial>) {
    onChange(testimonials.map((t, i) => (i === idx ? { ...t, ...patch } : t)))
  }

  function remove(idx: number) {
    onChange(testimonials.filter((_, i) => i !== idx))
  }

  function add() {
    onChange([...testimonials, { text: '', author: '', role: '' }])
  }

  return (
    <div className="space-y-4">
      {testimonials.map((t, idx) => {
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx
        return (
          <div
            key={idx}
            {...dragProps(idx)}
            className={`bg-bg-card border rounded-xl p-4 space-y-3 transition-all ${
              isOver ? 'border-accent border-2' : 'border-bg-hover'
            } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="cursor-grab text-foreground-muted text-base select-none" title="Arraste para reordenar">⠿</span>
                <span className="text-accent font-display text-2xl leading-none">&ldquo;</span>
              </div>
              <button onClick={() => remove(idx)} className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10">Remover</button>
            </div>
            <textarea
              value={t.text}
              onChange={(e) => update(idx, { text: e.target.value })}
              placeholder="Texto do depoimento..."
              rows={3}
              className="w-full bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50 resize-none"
            />
            <div className="flex gap-3">
              <input
                type="text"
                value={t.author}
                onChange={(e) => update(idx, { author: e.target.value })}
                placeholder="Nome do cliente"
                className="flex-1 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
              />
              <input
                type="text"
                value={t.role || ''}
                onChange={(e) => update(idx, { role: e.target.value })}
                placeholder="Projeto / Função"
                className="flex-1 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
              />
            </div>
          </div>
        )
      })}
      <button onClick={add} className="w-full text-accent text-sm border border-dashed border-accent/40 rounded-xl px-4 py-3 hover:bg-accent/10 transition-colors">
        + Adicionar depoimento
      </button>
    </div>
  )
}
