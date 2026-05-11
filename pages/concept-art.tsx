import { GetServerSideProps } from 'next'
import Layout from '@/components/Layout'
import TypeWriter from '@/components/TypeWriter'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import type { GalleryImage, GalleriesData } from '@/types/cms'
import { getCmsData } from '@/lib/cms-server'

type Tab = 'cenario' | 'personagem'

interface Props {
  cenario: GalleryImage[]
  personagem: GalleryImage[]
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const data = await getCmsData<GalleriesData>('galleries')
  return { props: { cenario: data.conceptArt.cenario, personagem: data.conceptArt.personagem } }
}

export default function ConceptArtPage({ cenario, personagem }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cenario')
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)

  const images = activeTab === 'cenario' ? cenario : personagem

  return (
    <Layout title="Concept Art" description="Galeria de concept art por By Theodora D.">
      <section className="pt-14 pb-8 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-fit mx-auto font-display text-5xl font-bold text-foreground mb-10 bg-bg px-8 py-3"
        >
          <TypeWriter text="Concept Art" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />

        <div className="flex justify-center gap-2 mb-6">
          {(['cenario', 'personagem'] as Tab[]).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-accent text-bg'
                  : 'border border-accent/40 text-accent hover:bg-accent/10'
              }`}
            >
              {tab === 'cenario' ? 'Cenário' : 'Personagem'}
            </motion.button>
          ))}
        </div>
      </section>

      {/* Scroll horizontal estilo ArtStation */}
      <motion.div
        key={activeTab}
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
            onClick={() => setLightbox(img)}
            className="relative w-72 h-72 rounded-3xl overflow-hidden bg-bg-card cursor-pointer flex-shrink-0 group border border-bg-hover hover:border-accent/40 transition-colors"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="288px"
            />
            {img.title && (
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-foreground text-xs font-semibold truncate">{img.title}</p>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lightbox-overlay"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="relative max-w-4xl max-h-[90vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full h-[75vh]">
                <Image src={lightbox.src} alt={lightbox.alt} fill className="object-contain" sizes="100vw" />
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-4 right-4 text-foreground-muted hover:text-foreground bg-bg/80 rounded-full p-2 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              {lightbox.title && <p className="text-center text-foreground font-semibold text-base mt-3">{lightbox.title}</p>}
              {lightbox.description && <p className="text-center text-foreground-muted text-sm mt-1 max-w-lg mx-auto px-4">{lightbox.description}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
