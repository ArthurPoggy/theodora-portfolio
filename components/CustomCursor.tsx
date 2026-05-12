import { useEffect, useRef } from 'react'

/**
 * Cursor customizado pixel-art. Renderiza o div SEMPRE (mesmo no SSR) —
 * o useEffect anexa os listeners após o mount. Em devices touch-only
 * o useEffect bailout e o div fica invisível (opacity 0).
 *
 * Bug corrigido: a versão anterior usava `if (!mounted) return null`
 * antes do return do JSX, e setMounted(true) era chamado DENTRO do
 * useEffect — o que significava que `ref.current` era null quando o
 * effect tentava instalar listeners (re-render ainda não tinha rodado).
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Touch-only? Não instala nada; div fica invisível
    if (window.matchMedia('(hover: none)').matches) return

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

  return (
    <div
      ref={ref}
      aria-hidden
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
