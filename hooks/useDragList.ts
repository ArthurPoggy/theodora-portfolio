import { useState } from 'react'

/**
 * Hook reutilizável para reordenar uma lista via HTML5 drag-and-drop nativo,
 * sem nova dependência. Devolve `dragProps(idx)` que se espalha no elemento
 * arrastável e expõe `dragIdx` / `overIdx` para estilização.
 */
export function useDragList<T>(items: T[], onChange: (next: T[]) => void) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function commit() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null)
      setOverIdx(null)
      return
    }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(overIdx, 0, moved)
    onChange(next)
    setDragIdx(null)
    setOverIdx(null)
  }

  return {
    dragIdx,
    overIdx,
    dragProps: (idx: number) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setDragIdx(idx)
        // Necessário para o Firefox iniciar o drag
        e.dataTransfer.effectAllowed = 'move'
        try { e.dataTransfer.setData('text/plain', String(idx)) } catch {}
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overIdx !== idx) setOverIdx(idx)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        commit()
      },
      onDragEnd: () => {
        setDragIdx(null)
        setOverIdx(null)
      },
    }),
  }
}
