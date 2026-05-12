import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setMounted(true)

    // Detecta touch-only (sem mouse/trackpad): aí esconde e nem instala listener
    const touchOnly = window.matchMedia('(hover: none)').matches
    if (touchOnly) return

    const el = ref.current
    if (!el) return

    let pendingX = 0
    let pendingY = 0
    let frame = 0
    let visible = false

    function apply() {
      frame = 0
      if (!el) return
      el.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0)`
      if (!visible) {
        el.style.opacity = '1'
        visible = true
      }
    }

    function onMove(e: MouseEvent) {
      pendingX = e.clientX
      pendingY = e.clientY
      if (!frame) frame = requestAnimationFrame(apply)
    }
    function onLeave() {
      if (!el) return
      el.style.opacity = '0'
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

  if (!mounted) return null

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cursor.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}
