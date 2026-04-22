import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import ImageGrid from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'
import type { GalleryImage, VideoItem, AnimationsData } from '@/types/cms'
import animationsData from '@/data/animations.json'

interface Props {
  gifs: GalleryImage[]
  videos: VideoItem[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = animationsData as AnimationsData
  return { props: { gifs: data.gifs, videos: data.videos } }
}

export default function AnimacoesPage({ gifs, videos }: Props) {
  return (
    <Layout title="Animações" description="Galeria de animações e vídeos por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-10"
        >
          <TypeWriter text="Animações" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />
      </section>

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
    </Layout>
  )
}
