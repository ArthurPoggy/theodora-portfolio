import { useEffect, useRef, useState, useCallback } from 'react'
import { Rnd } from 'react-rnd'
import type { MediaOverlay } from '@/types/cms'

interface Props {
  item: MediaOverlay
  selected: boolean
  onSelect: () => void
}

export default function EditableOverlay({ item, selected, onSelect }: Props) {
  const [viewportSize, setViewportSize] = useState({ w: 1440, h: 900 })
  const [layoutHeight, setLayoutHeight] = useState(900)
  const [aspectRatio, setAspectRatio] = useState(1)

  useEffect(() => {
    function measure() {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight })
      setLayoutHeight(document.documentElement.scrollHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    const t = setTimeout(measure, 500)
    return () => {
      window.removeEventListener('resize', measure)
      clearTimeout(t)
    }
  }, [])

  const widthPx = (item.width * viewportSize.w) / 100
  const heightPx = widthPx / aspectRatio
  const containerHeight = item.positioning === 'viewport' ? viewportSize.h : layoutHeight

  const { xPx, yPx } = anchorToPixels(item, viewportSize.w, widthPx, heightPx, containerHeight)

  function postUpdate(patch: Partial<MediaOverlay>) {
    if (typeof window === 'undefined' || window.parent === window) return
    try {
      window.parent.postMessage({ type: 'overlay-update', id: item.id, patch }, window.location.origin)
    } catch {}
  }

  function handleDragStop(_e: unknown, d: { x: number; y: number }) {
    const newPos = pixelsToAnchor(d.x, d.y, item, viewportSize.w, widthPx, heightPx, containerHeight)
    postUpdate({ x: newPos.x, y: newPos.y })
  }

  function handleResizeStop(_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, position: { x: number; y: number }) {
    const newWidthPx = ref.offsetWidth
    const newHeightPx = ref.offsetHeight
    const newWidthPercent = (newWidthPx / viewportSize.w) * 100
    const newPos = pixelsToAnchor(position.x, position.y, item, viewportSize.w, newWidthPx, newHeightPx, containerHeight)
    postUpdate({ x: newPos.x, y: newPos.y, width: newWidthPercent })
  }

  return (
    <Rnd
      size={{ width: widthPx, height: heightPx }}
      position={{ x: xPx, y: yPx }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      lockAspectRatio={aspectRatio > 0 ? aspectRatio : false}
      enableResizing={{ topLeft: true, topRight: true, bottomLeft: true, bottomRight: true, top: false, bottom: false, left: false, right: false }}
      bounds={item.positioning === 'viewport' ? 'window' : 'parent'}
      style={{
        position: item.positioning === 'viewport' ? 'fixed' : 'absolute',
        zIndex: item.zIndex + 50,
        outline: selected ? '2px solid #b49cfd' : '1px dashed rgba(180, 156, 253, 0.4)',
        outlineOffset: '2px',
        cursor: 'move',
      }}
      onMouseDown={onSelect}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `rotate(${item.rotation}deg)`,
          opacity: item.visible ? 1 : 0.35,
        }}
      >
        {item.type === 'video' ? (
          <video
            src={item.src}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            onLoad={(e) => {
              const img = e.currentTarget
              if (img.naturalWidth && img.naturalHeight) {
                setAspectRatio(img.naturalWidth / img.naturalHeight)
              }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
          />
        )}
      </div>

      {selected && (
        <RotationHandle
          currentRotation={item.rotation}
          onRotate={(r) => postUpdate({ rotation: r })}
        />
      )}
    </Rnd>
  )
}

function RotationHandle({ currentRotation, onRotate }: { currentRotation: number; onRotate: (r: number) => void }) {
  const handleRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const handle = handleRef.current
    if (!handle) return
    const rndBox = handle.parentElement
    if (!rndBox) return
    const rect = rndBox.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    function onMove(ev: PointerEvent) {
      const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * (180 / Math.PI) + 90
      onRotate(Math.round(angle))
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [onRotate])

  return (
    <>
      <div style={{ position: 'absolute', top: -30, left: '50%', width: 2, height: 30, background: '#b49cfd', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
      <div
        ref={handleRef}
        onPointerDown={onPointerDown}
        title={`Rotacionar (atual: ${currentRotation}°)`}
        style={{
          position: 'absolute', top: -42, left: '50%', transform: 'translateX(-50%)',
          width: 18, height: 18, borderRadius: '50%',
          background: '#b49cfd', border: '2px solid white',
          cursor: 'grab', touchAction: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
      />
    </>
  )
}

function anchorToPixels(item: MediaOverlay, vw: number, widthPx: number, heightPx: number, containerHeight: number): { xPx: number; yPx: number } {
  let xPx: number
  let yPx: number
  if (item.anchor === 'tl' || item.anchor === 'bl') xPx = (item.x * vw) / 100
  else xPx = vw - widthPx - (item.x * vw) / 100
  if (item.anchor === 'tl' || item.anchor === 'tr') yPx = item.y
  else yPx = containerHeight - heightPx - item.y
  return { xPx, yPx }
}

function pixelsToAnchor(xPx: number, yPx: number, item: MediaOverlay, vw: number, widthPx: number, heightPx: number, containerHeight: number): { x: number; y: number } {
  let x: number
  let y: number
  if (item.anchor === 'tl' || item.anchor === 'bl') x = (xPx / vw) * 100
  else x = ((vw - widthPx - xPx) / vw) * 100
  if (item.anchor === 'tl' || item.anchor === 'tr') y = yPx
  else y = containerHeight - heightPx - yPx
  return { x: Math.round(x * 100) / 100, y: Math.round(y) }
}
