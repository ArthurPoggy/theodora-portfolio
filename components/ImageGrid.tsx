import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GalleryImage } from '@/types/cms'
import OptimizedMedia from './OptimizedMedia'
import Lightbox from './Lightbox'

export type { GalleryImage }

interface ImageGridProps {
  images: GalleryImage[]
}

export default function ImageGrid({ images }: ImageGridProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

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
            className="group relative overflow-hidden rounded-3xl bg-bg-card cursor-pointer break-inside-avoid"
            onClick={() => setLightboxIdx(idx)}
            whileHover={{ scale: 1.03 }}
          >
            <div className="relative w-full aspect-square">
              <OptimizedMedia
                source={img}
                purpose="grid"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/50 rounded-3xl transition-all duration-300 pointer-events-none" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl shadow-[0_0_20px_rgba(139,232,248,0.25)] pointer-events-none" />
            {img.title && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <p className="text-foreground text-xs font-semibold truncate">{img.title}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <Lightbox
        items={images}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onIndexChange={setLightboxIdx}
      />
    </>
  )
}
