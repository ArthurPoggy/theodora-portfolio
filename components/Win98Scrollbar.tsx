import { useEffect, useState } from 'react'

const BTN: React.CSSProperties = {
  width: 18,
  height: 18,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#c0c0c0',
  border: '2px solid',
  borderColor: '#ffffff #808080 #808080 #ffffff',
  fontSize: 8,
  color: '#000',
  userSelect: 'none',
  lineHeight: 1,
}

const TRACK: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  background: 'repeating-conic-gradient(#c0c0c0 0% 25%, #a8a8a8 0% 50%) 0 0 / 4px 4px',
}

const THUMB: React.CSSProperties = {
  position: 'absolute',
  left: 2,
  right: 2,
  height: 40,
  background: '#c0c0c0',
  border: '2px solid',
  borderColor: '#ffffff #808080 #808080 #ffffff',
}

export default function Win98Scrollbar() {
  const [thumbTop, setThumbTop] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight
      if (maxScroll <= 0) { setThumbTop(0); return }
      const pct = window.scrollY / maxScroll
      const trackHeight = window.innerHeight - 36 - 40
      setThumbTop(pct * trackHeight)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!mounted) return null

  return (
    <div
      className="hidden lg:flex flex-col fixed right-0 top-0 bottom-0 z-30"
      style={{ width: 18, background: '#c0c0c0', borderLeft: '2px solid #808080', outline: '1px solid #000' }}
    >
      <div style={BTN}>▲</div>
      <div style={TRACK}>
        <div style={{ ...THUMB, top: thumbTop }} />
      </div>
      <div style={BTN}>▼</div>
    </div>
  )
}
