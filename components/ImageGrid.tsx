import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GalleryImage {
  src: string
  alt: string
  width?: number
  height?: number
}

interface ImageGridProps {
  images: GalleryImage[]
}

export default function ImageGrid({ images }: ImageGridProps) {
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 px-6 py-10 max-w-7xl mx-auto">
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (idx % 6) * 0.07 }}
            className="group relative overflow-hidden rounded-xl bg-bg-card cursor-pointer break-inside-avoid"
            onClick={() => setLightbox(img)}
            whileHover={{ scale: 1.03 }}
          >
            <div className="relative w-full aspect-square">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            {/* Overlay sutil */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/50 rounded-xl transition-all duration-300 pointer-events-none" />
            {/* Sombra dourada no hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl shadow-[0_0_20px_rgba(201,168,76,0.25)] pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="relative max-w-4xl max-h-[90vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[80vh]">
                <Image
                  src={lightbox.src}
                  alt={lightbox.alt}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 text-foreground-muted hover:text-foreground bg-bg/80 rounded-full p-2 transition-colors"
                aria-label="Fechar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              {lightbox.alt && (
                <p className="text-center text-foreground-muted text-sm mt-3">{lightbox.alt}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
