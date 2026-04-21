import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'

const GIFS: GalleryImage[] = [
  { src: '/images/placeholder-concept-1.svg', alt: 'GIF - Animação 1' },
  { src: '/images/placeholder-concept-1.svg', alt: 'GIF - Animação 2' },
  { src: '/images/placeholder-concept-1.svg', alt: 'GIF - Animação 3' },
  { src: '/images/placeholder-concept-1.svg', alt: 'GIF - Animação 4' },
]

type VideoItem =
  | { type: 'youtube'; title: string; youtubeId: string }
  | { type: 'mp4'; title: string; src: string }

const VIDEOS: VideoItem[] = [
  { type: 'youtube', title: 'Animação 1', youtubeId: 'dQw4w9WgXcQ' },
  { type: 'youtube', title: 'Animação 2', youtubeId: 'dQw4w9WgXcQ' },
  // Para adicionar MP4: { type: 'mp4', title: 'Nome', src: '/videos/animacao.mp4' }
]

export default function AnimacoesPage() {
  return (
    <Layout title="Animações" description="Galeria de animações e vídeos por by.TheodoraD">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-6"
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

      {/* Seção GIFs */}
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
      <ImageGrid images={GIFS} />

      {/* Seção Vídeos */}
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
          {VIDEOS.map((video, idx) => (
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
    </Layout>
  )
}
