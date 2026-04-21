import { useState } from 'react'

interface SkillsEditorProps {
  skills: string[]
  onChange: (skills: string[]) => void
}

export default function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (!trimmed || skills.includes(trimmed)) return
    onChange([...skills, trimmed])
    setInput('')
  }

  function remove(idx: number) {
    onChange(skills.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-bg-hover rounded-full text-sm text-foreground-muted">
            {skill}
            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-300 text-xs leading-none">✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nova habilidade..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          className="flex-1 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/50"
        />
        <button onClick={add} className="px-4 py-2 bg-accent text-bg text-sm rounded-lg font-semibold hover:bg-accent-light">
          Adicionar
        </button>
      </div>
    </div>
  )
}
