import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import ImageGrid from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'
import type { GalleryImage, GalleriesData } from '@/types/cms'
import galleriesData from '@/data/galleries.json'

interface Props { images: GalleryImage[] }

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = galleriesData as GalleriesData
  return { props: { images: data.branding } }
}

export default function BrandingPage({ images }: Props) {
  return (
    <Layout title="Branding Jobs" description="Projetos de identidade visual e branding por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-10"
        >
          <TypeWriter text="Branding Jobs" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />
      </section>
      <ImageGrid images={images} />
    </Layout>
  )
}
