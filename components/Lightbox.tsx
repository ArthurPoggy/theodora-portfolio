import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import OptimizedMedia from './OptimizedMedia'
import { isVideoMedia, type GalleryImage } from '@/types/cms'

interface LightboxProps {
  items: GalleryImage[]
  index: number | null
  onClose: () => void
  onIndexChange?: (idx: number) => void
}

/**
 * Modal de visualização. Renderiza por padrão a variante 1600w (rápido).
 * Botão "Ver em resolução original" carrega o arquivo cru sob demanda.
 * Suporta navegação prev/next via setas do teclado, fecha com Esc/click fora.
 */
export default function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const [showOriginal, setShowOriginal] = useState(false)
  const isOpen = index !== null && index >= 0 && index < items.length
  const item = isOpen ? items[index] : null

  // Reset toggle "original" sempre que navega para outro item
  useEffect(() => { setShowOriginal(false) }, [index])

  const goPrev = useCallback(() => {
    if (index === null || !onIndexChange) return
    onIndexChange((index - 1 + items.length) % items.length)
  }, [index, items.length, onIndexChange])

  const goNext = useCallback(() => {
    if (index === null || !onIndexChange) return
    onIndexChange((index + 1) % items.length)
  }, [index, items.length, onIndexChange])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, goPrev, goNext])

  // Trava scroll do body enquanto aberto
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.92 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-[95vw] max-h-[92vh] w-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute -top-2 right-0 z-10 text-foreground-muted hover:text-foreground bg-bg/80 rounded-full p-2 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Navegação prev/next */}
            {items.length > 1 && onIndexChange && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  aria-label="Anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground bg-bg/60 hover:bg-bg/90 rounded-full p-3 transition-colors"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18L9 12L15 6" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  aria-label="Próxima"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground bg-bg/60 hover:bg-bg/90 rounded-full p-3 transition-colors"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </>
            )}

            {/* Mídia */}
            <div className="relative w-full" style={{ maxHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
              {isVideoMedia(item) ? (
                <video
                  src={item.src}
                  poster={item.poster}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : showOriginal && item.original ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.original}
                  alt={item.alt || ''}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : (
                <div className="relative w-full" style={{ height: '80vh' }}>
                  <OptimizedMedia
                    source={item}
                    purpose="lightbox"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>

            {/* Footer: legenda + botão "Ver original" */}
            <div className="mt-3 text-center w-full max-w-3xl">
              {item.title && <p className="text-foreground font-semibold text-base">{item.title}</p>}
              {item.description && <p className="text-foreground-muted text-sm mt-1 px-4">{item.description}</p>}
              {!isVideoMedia(item) && item.original && (
                <button
                  onClick={() => setShowOriginal((v) => !v)}
                  className="mt-3 text-xs px-3 py-1.5 border border-accent/40 text-accent rounded-full hover:bg-accent/10 transition-colors"
                >
                  {showOriginal ? '← Voltar para visualização rápida' : 'Ver em resolução original'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
