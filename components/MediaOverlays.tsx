import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useOverlays } from './OverlaysContext'
import { SPOTIFY_MIN_HEIGHT, type MediaOverlay } from '@/types/cms'

export default function MediaOverlays() {
  const router = useRouter()
  const overlays = useOverlays()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(router.query.noOverlays === '1')
  }, [router.query.noOverlays])

  // Usa a URL real (asPath sem query/hash) — não router.pathname, que para as
  // páginas dinâmicas seria o padrão "/[slug]" em vez de "/modelagem-3d".
  const realPath = router.asPath.split(/[?#]/)[0]
  const items = overlays[realPath] || []

  if (hidden || items.length === 0) return null

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

  if (item.type === 'spotify') {
    // MusicPlayer=40, Win98Scrollbar=30 — Spotify precisa aparecer acima dos dois
    const spotifyZ = Math.max(item.zIndex, 45)
    const spotifyH = Math.max(item.height ?? SPOTIFY_MIN_HEIGHT, SPOTIFY_MIN_HEIGHT)

    // O y é gravado em px absolutos, mas o player é `position: fixed` — numa
    // janela mais baixa que a de quem editou, ele cai fora da tela. O min()
    // prende o player à janela de quem está visitando, seja qual for a altura.
    const clamped = `min(${item.y}px, calc(100vh - ${spotifyH}px - 8px))`
    const verticalClamp =
      item.anchor === 'tl' || item.anchor === 'tr'
        ? { top: clamped }
        : { bottom: clamped }

    return (
      <div
        className={rootClass}
        style={{
          ...positionStyle,
          ...verticalClamp,
          width: `${item.width}vw`,
          height: spotifyH,
          zIndex: spotifyZ,
        }}
      >
        <iframe
          src={item.src}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
        />
      </div>
    )
  }

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
        <video
          src={item.src}
          autoPlay loop muted playsInline style={mediaStyle}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt=""
          style={mediaStyle}
        />
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
