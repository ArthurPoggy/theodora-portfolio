import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import ImageGrid from '@/components/ImageGrid'
import NsfwGate from '@/components/NsfwGate'
import { motion } from 'framer-motion'
import type { GalleryImage, GalleriesData } from '@/types/cms'
import { getCmsData } from '@/lib/cms-server'

interface Props { images: GalleryImage[] }

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = await getCmsData<GalleriesData>('galleries')
  return { props: { images: data.nsfw }, revalidate: 30 }
}

export default function NsfwPage({ images }: Props) {
  return (
    <Layout title="NSFW" description="Conteúdo adulto — acesso restrito a maiores de 18 anos">
      <NsfwGate>
        <section className="pt-14 pb-8 px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-fit mx-auto font-display text-5xl font-bold text-foreground mb-10 bg-bg px-8 py-3"
          >
            NSFW
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
            className="text-foreground-muted text-sm"
          >
            Conteúdo adulto — acesso restrito a maiores de 18 anos
          </motion.p>
        </section>
        <ImageGrid images={images} />
      </NsfwGate>
    </Layout>
  )
}
