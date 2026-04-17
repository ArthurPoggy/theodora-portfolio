import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import NsfwGate from '@/components/NsfwGate'
import { motion } from 'framer-motion'

const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-ilustracao-1.svg', alt: 'NSFW - Obra 1' },
  { src: '/images/placeholder-ilustracao-2.svg', alt: 'NSFW - Obra 2' },
  { src: '/images/placeholder-ilustracao-3.svg', alt: 'NSFW - Obra 3' },
  { src: '/images/placeholder-ilustracao-4.svg', alt: 'NSFW - Obra 4' },
  { src: '/images/placeholder-ilustracao-5.svg', alt: 'NSFW - Obra 5' },
  { src: '/images/placeholder-ilustracao-6.svg', alt: 'NSFW - Obra 6' },
]

export default function NsfwPage() {
  return (
    <Layout title="NSFW" description="Conteúdo adulto — acesso restrito a maiores de 18 anos">
      <NsfwGate>
        <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-5xl font-bold text-foreground mb-3"
          >
            NSFW
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-0.5 w-24 bg-accent mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-foreground-muted text-sm"
          >
            Conteúdo adulto — acesso restrito a maiores de 18 anos
          </motion.p>
        </section>
        <ImageGrid images={IMAGES} />
      </NsfwGate>
    </Layout>
  )
}
