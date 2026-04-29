import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (ref.current) {
        ref.current.style.left = e.clientX + 'px'
        ref.current.style.top = e.clientY + 'px'
      }
      if (!visible) setVisible(true)
    }
    const hide = () => setVisible(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseleave', hide)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseleave', hide)
    }
  }, [visible])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 99999,
        width: 28,
        opacity: visible ? 1 : 0,
        transform: 'translate(0, 0)',
        imageRendering: 'pixelated',
      }}
    >
      <img src="/cursor.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}
