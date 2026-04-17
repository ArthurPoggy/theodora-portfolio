import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import { motion } from 'framer-motion'
import TypeWriter from '@/components/TypeWriter'

// Adicionar imagens reais em public/images/3d/ e atualizar este array
const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-3d-1.svg', alt: 'Modelagem 3D - Obra 1' },
  { src: '/images/placeholder-3d-2.svg', alt: 'Modelagem 3D - Obra 2' },
  { src: '/images/placeholder-3d-3.svg', alt: 'Modelagem 3D - Obra 3' },
  { src: '/images/placeholder-3d-4.svg', alt: 'Modelagem 3D - Obra 4' },
  { src: '/images/placeholder-3d-5.svg', alt: 'Modelagem 3D - Obra 5' },
  { src: '/images/placeholder-3d-6.svg', alt: 'Modelagem 3D - Obra 6' },
]

export default function Modelagem3DPage() {
  return (
    <Layout title="Modelagem 3D" description="Galeria de trabalhos de modelagem 3D por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          <TypeWriter text="Modelagem 3D" />
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
