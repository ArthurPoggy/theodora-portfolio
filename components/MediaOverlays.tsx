import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useOverlays } from './OverlaysContext'
import type { MediaOverlay } from '@/types/cms'

export default function MediaOverlays() {
  const router = useRouter()
  const overlays = useOverlays()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setHidden(router.query.noOverlays === '1')
  }, [router.query.noOverlays])

  const items = overlays[router.pathname] || []

  useEffect(() => {
    console.log('[MediaOverlays] pathname:', router.pathname)
    console.log('[MediaOverlays] todos os overlays carregados:', overlays)
    console.log('[MediaOverlays] itens nesta página:', items)
    console.log('[MediaOverlays] hidden:', hidden)
    const spotifyItems = items.filter((i) => i.type === 'spotify')
    if (spotifyItems.length > 0) {
      console.log('[MediaOverlays] Spotify encontrado:', spotifyItems)
    }
  }, [router.pathname, overlays, items, hidden])

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
    console.log('[StaticOverlay] renderizando Spotify:', item.src, '| posição:', positionStyle, '| zIndex efetivo:', spotifyZ, '| visível:', item.visible)
    return (
      <div
        className={rootClass}
        style={{
          ...positionStyle,
          width: `${item.width}vw`,
          height: item.height ?? 152,
          zIndex: spotifyZ,
        }}
      >
        <iframe
          src={item.src}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          onLoad={() => console.log('[StaticOverlay] iframe Spotify carregou:', item.src)}
          onError={() => console.error('[StaticOverlay] iframe Spotify ERRO ao carregar:', item.src)}
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

  console.log('[StaticOverlay] renderizando mídia:', item.src, '| tipo:', item.type, '| posição:', positionStyle, '| width:', item.width + 'vw', '| hideOnMobile:', item.hideOnMobile, '| rootClass:', rootClass)

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
          onLoadedData={() => console.log('[StaticOverlay] vídeo carregou:', item.src)}
          onError={() => console.error('[StaticOverlay] ERRO ao carregar vídeo:', item.src)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt=""
          style={mediaStyle}
          onLoad={() => console.log('[StaticOverlay] imagem carregou:', item.src)}
          onError={() => console.error('[StaticOverlay] ERRO ao carregar imagem:', item.src)}
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
