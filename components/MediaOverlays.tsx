import { useRouter } from 'next/router'
import { useOverlays } from './OverlaysContext'
import type { MediaOverlay } from '@/types/cms'

export default function MediaOverlays() {
  const router = useRouter()
  const overlays = useOverlays()

  const items = overlays[router.pathname] || []
  if (items.length === 0) return null

  return (
    <>
      {items.map((item) => (
        <StaticOverlay key={item.id} item={item} />
      ))}
    </>
  )
}

function StaticOverlay({ item }: { item: MediaOverlay }) {
  if (!item.visible) return null

  const positionStyle = buildPositionStyle(item)
  const rootClass = item.hideOnMobile ? 'hidden lg:block' : 'block'

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    display: 'block',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  return (
    <div
      aria-hidden
      className={rootClass}
      style={{
        ...positionStyle,
        width: `${item.width}vw`,
        zIndex: item.zIndex,
        transform: `rotate(${item.rotation}deg)`,
        pointerEvents: 'none',
      }}
    >
      {item.type === 'video' ? (
        <video src={item.src} autoPlay loop muted playsInline style={mediaStyle} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt="" style={mediaStyle} />
      )}
    </div>
  )
}

function buildPositionStyle(item: MediaOverlay): React.CSSProperties {
  const position = item.positioning === 'viewport' ? 'fixed' : 'absolute'
  const style: React.CSSProperties = { position }
  if (item.anchor === 'tl' || item.anchor === 'bl') {
    style.left = `${item.x}vw`
  } else {
    style.right = `${item.x}vw`
  }
  if (item.anchor === 'tl' || item.anchor === 'tr') {
    style.top = `${item.y}px`
  } else {
    style.bottom = `${item.y}px`
  }
  return style
}
