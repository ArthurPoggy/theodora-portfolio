import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Desabilita em dispositivos sem hover (touch / mobile)
    if (typeof window === 'undefined') return
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!supportsHover) return
    setEnabled(true)

    const el = ref.current
    if (!el) return

    let pendingX = 0
    let pendingY = 0
    let frame = 0
    let visible = false

    function apply() {
      frame = 0
      if (el) {
        el.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`
        if (!visible) {
          el.style.opacity = '1'
          visible = true
        }
      }
    }

    function onMove(e: MouseEvent) {
      pendingX = e.clientX
      pendingY = e.clientY
      if (!frame) frame = requestAnimationFrame(apply)
    }
    function onLeave() {
      if (el) el.style.opacity = '0'
      visible = false
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        width: 28,
        opacity: 0,
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        imageRendering: 'pixelated',
      }}
    >
      <img src="/cursor.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}
