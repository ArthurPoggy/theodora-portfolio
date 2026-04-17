import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import { motion } from 'framer-motion'
import TypeWriter from '@/components/TypeWriter'

const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-fisico-1.svg', alt: 'Trabalho Físico - Obra 1' },
  { src: '/images/placeholder-fisico-2.svg', alt: 'Trabalho Físico - Obra 2' },
  { src: '/images/placeholder-fisico-3.svg', alt: 'Trabalho Físico - Obra 3' },
  { src: '/images/placeholder-fisico-4.svg', alt: 'Trabalho Físico - Obra 4' },
  { src: '/images/placeholder-fisico-5.svg', alt: 'Trabalho Físico - Obra 5' },
  { src: '/images/placeholder-fisico-6.svg', alt: 'Trabalho Físico - Obra 6' },
]

export default function TrabalhosFisicosPage() {
  return (
    <Layout title="Trabalhos Físicos" description="Galeria de trabalhos físicos e tradicionais por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          <TypeWriter text="Trabalhos Físicos" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto"
        />
      </section>
      <ImageGrid images={IMAGES} />
    </Layout>
  )
}
