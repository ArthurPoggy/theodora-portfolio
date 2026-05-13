import { GetStaticProps, GetStaticPaths } from 'next'
import { useState } from 'react'
import Layout from '@/components/Layout'
import ImageGrid from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import NsfwGate from '@/components/NsfwGate'
import OptimizedImage from '@/components/OptimizedImage'
import Lightbox from '@/components/Lightbox'
import { motion } from 'framer-motion'
import type { DynamicPage, PagesData, GalleryImage } from '@/types/cms'
import { getCmsData } from '@/lib/cms-server'

const RESERVED = new Set([
  'admin', 'sobre', 'contato', 'stats',
  'api', '_app', '_document', '_next',
])

interface Props {
  page: DynamicPage
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getCmsData<PagesData>('pages').catch(() => [] as PagesData)
  return {
    paths: pages
      .filter((p) => !RESERVED.has(p.slug))
      .map((p) => ({ params: { slug: p.slug } })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || '')
  if (RESERVED.has(slug)) return { notFound: true }
  const pages = await getCmsData<PagesData>('pages').catch(() => [] as PagesData)
  const page = pages.find((p) => p.slug === slug)
  if (!page) return { notFound: true }
  return { props: { page }, revalidate: 30 }
}

function PageHeader({ label }: { label: string }) {
  return (
    <section className="pt-14 pb-8 px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-fit mx-auto font-display text-5xl font-bold text-bg mb-10 bg-pastel px-8 py-3 rounded-xl"
      >
        <TypeWriter text={label} />
      </motion.h1>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="h-0.5 w-24 bg-accent mx-auto mb-8"
      />
    </section>
  )
}

function GalleryView({ page }: { page: DynamicPage }) {
  return (
    <>
      <PageHeader label={page.label} />
      {page.description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-foreground-muted text-base text-center px-6 -mt-4 mb-6"
        >
          {page.description}
        </motion.p>
      )}
      <ImageGrid images={page.images || []} />
    </>
  )
}

function TabsGalleryView({ page }: { page: DynamicPage }) {
  const tabs = page.tabs || []
  const [activeKey, setActiveKey] = useState<string>(tabs[0]?.key || '')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const images: GalleryImage[] = tabs.find((t) => t.key === activeKey)?.images || []

  return (
    <>
      <PageHeader label={page.label} />
      {tabs.length > 0 && (
        <div className="flex justify-center gap-2 mb-6 px-6">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setActiveKey(tab.key); setLightboxIdx(null) }}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeKey === tab.key
                  ? 'bg-accent text-bg'
                  : 'border border-accent/40 text-accent hover:bg-accent/10'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      )}

      <motion.div
        key={activeKey}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="artstation-scroll px-6 pb-8"
      >
        {images.length === 0 && (
          <p className="text-foreground-muted text-sm italic px-4 py-10">Nenhuma imagem nesta categoria ainda.</p>
        )}
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.03 }}
            onClick={() => setLightboxIdx(idx)}
            className="relative w-72 h-72 rounded-3xl overflow-hidden bg-bg-card cursor-pointer flex-shrink-0 group border border-bg-hover hover:border-accent/40 transition-colors"
          >
            <OptimizedImage
              source={img}
              purpose="grid"
              fill
              priority={idx < 4}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {img.title && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-foreground text-xs font-semibold truncate">{img.title}</p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <Lightbox
        items={images}
        index={lightboxIdx}
        onClose={() => setLightboxIdx(null)}
        onIndexChange={setLightboxIdx}
      />
    </>
  )
}

function AnimationsView({ page }: { page: DynamicPage }) {
  const gifs = page.gifs || []
  const videos = page.videos || []
  return (
    <>
      <PageHeader label={page.label} />
      {gifs.length > 0 && (
        <>
          <section className="px-6 max-w-7xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-semibold text-accent mb-6 mt-8"
            >
              GIFs
            </motion.h2>
          </section>
          <ImageGrid images={gifs} />
        </>
      )}

      {videos.length > 0 && (
        <section className="px-6 max-w-7xl mx-auto pb-16">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-semibold text-accent mb-6 mt-8"
          >
            Vídeos
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {videos.map((video, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col gap-3"
              >
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-bg-card border border-bg-card">
                  {video.type === 'youtube' ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtubeId}`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    <video
                      src={video.src}
                      title={video.title}
                      controls
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-foreground-muted text-sm text-center">{video.title}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default function DynamicSlugPage({ page }: Props) {
  const content =
    page.type === 'tabs-gallery' ? <TabsGalleryView page={page} /> :
    page.type === 'animations'  ? <AnimationsView page={page} /> :
                                  <GalleryView page={page} />

  return (
    <Layout title={page.label} description={page.description}>
      {page.isNsfw ? <NsfwGate>{content}</NsfwGate> : content}
    </Layout>
  )
}
