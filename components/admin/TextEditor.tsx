interface TextEditorProps {
  paragraphs: string[]
  onChange: (paragraphs: string[]) => void
  label?: string
}

export default function TextEditor({ paragraphs, onChange, label = 'Texto' }: TextEditorProps) {
  function update(idx: number, value: string) {
    onChange(paragraphs.map((p, i) => (i === idx ? value : p)))
  }

  function remove(idx: number) {
    onChange(paragraphs.filter((_, i) => i !== idx))
  }

  function add() {
    onChange([...paragraphs, ''])
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <textarea
            value={p}
            onChange={(e) => update(idx, e.target.value)}
            rows={3}
            placeholder={`${label} ${idx + 1}`}
            className="flex-1 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50 resize-none leading-relaxed"
          />
          <button onClick={() => remove(idx)} className="text-red-400 text-xs px-2 py-1 border border-red-500/40 rounded hover:bg-red-500/10 mt-1 flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={add} className="text-accent text-sm border border-dashed border-accent/40 rounded-lg px-4 py-2 hover:bg-accent/10 transition-colors w-full">
        + Adicionar parágrafo
      </button>
    </div>
  )
}
