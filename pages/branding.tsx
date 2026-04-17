import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import { motion } from 'framer-motion'
import TypeWriter from '@/components/TypeWriter'

const IMAGES: GalleryImage[] = [
  { src: '/images/placeholder-branding-1.svg', alt: 'Branding - Projeto 1' },
  { src: '/images/placeholder-branding-2.svg', alt: 'Branding - Projeto 2' },
  { src: '/images/placeholder-branding-3.svg', alt: 'Branding - Projeto 3' },
  { src: '/images/placeholder-branding-4.svg', alt: 'Branding - Projeto 4' },
  { src: '/images/placeholder-branding-5.svg', alt: 'Branding - Projeto 5' },
  { src: '/images/placeholder-branding-6.svg', alt: 'Branding - Projeto 6' },
]

export default function BrandingPage() {
  return (
    <Layout title="Branding Jobs" description="Projetos de identidade visual e branding por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          <TypeWriter text="Branding Jobs" />
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
