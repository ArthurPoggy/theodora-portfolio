import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import { motion } from 'framer-motion'

const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-ilustracao-1.svg', alt: 'Ilustração - Obra 1' },
  { src: '/images/placeholder-ilustracao-2.svg', alt: 'Ilustração - Obra 2' },
  { src: '/images/placeholder-ilustracao-3.svg', alt: 'Ilustração - Obra 3' },
  { src: '/images/placeholder-ilustracao-4.svg', alt: 'Ilustração - Obra 4' },
  { src: '/images/placeholder-ilustracao-5.svg', alt: 'Ilustração - Obra 5' },
  { src: '/images/placeholder-ilustracao-6.svg', alt: 'Ilustração - Obra 6' },
]

export default function IlustracoesPage() {
  return (
    <Layout title="Ilustrações" description="Galeria de ilustrações por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          Ilustrações
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
