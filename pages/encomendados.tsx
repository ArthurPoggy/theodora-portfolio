import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'

const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-ilustracao-1.svg', alt: 'Encomenda - Obra 1' },
  { src: '/images/placeholder-ilustracao-2.svg', alt: 'Encomenda - Obra 2' },
  { src: '/images/placeholder-ilustracao-3.svg', alt: 'Encomenda - Obra 3' },
  { src: '/images/placeholder-ilustracao-4.svg', alt: 'Encomenda - Obra 4' },
  { src: '/images/placeholder-ilustracao-5.svg', alt: 'Encomenda - Obra 5' },
  { src: '/images/placeholder-ilustracao-6.svg', alt: 'Encomenda - Obra 6' },
]

export default function EncomendadosPage() {
  return (
    <Layout title="Encomendados" description="Portfolio de trabalhos encomendados por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-6"
        >
          <TypeWriter text="Encomendados" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-foreground-muted text-base"
        >
          Trabalhos realizados para clientes
        </motion.p>
      </section>
      <ImageGrid images={IMAGES} />
    </Layout>
  )
}
