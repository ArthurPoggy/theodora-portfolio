import Layout from '@/components/Layout'
import ImageGrid, { GalleryImage } from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'
import { useState } from 'react'

const CENARIO: GalleryImage[] = [
  { src: '/images/placeholder-concept-1.svg', alt: 'Cenário - Obra 1' },
  { src: '/images/placeholder-concept-2.svg', alt: 'Cenário - Obra 2' },
  { src: '/images/placeholder-concept-3.svg', alt: 'Cenário - Obra 3' },
  { src: '/images/placeholder-concept-4.svg', alt: 'Cenário - Obra 4' },
  { src: '/images/placeholder-concept-5.svg', alt: 'Cenário - Obra 5' },
  { src: '/images/placeholder-concept-6.svg', alt: 'Cenário - Obra 6' },
]

const PERSONAGEM: GalleryImage[] = [
  { src: '/images/placeholder-ilustracao-1.svg', alt: 'Personagem - Obra 1' },
  { src: '/images/placeholder-ilustracao-2.svg', alt: 'Personagem - Obra 2' },
  { src: '/images/placeholder-ilustracao-3.svg', alt: 'Personagem - Obra 3' },
  { src: '/images/placeholder-ilustracao-4.svg', alt: 'Personagem - Obra 4' },
  { src: '/images/placeholder-ilustracao-5.svg', alt: 'Personagem - Obra 5' },
  { src: '/images/placeholder-ilustracao-6.svg', alt: 'Personagem - Obra 6' },
]

type Tab = 'cenario' | 'personagem'

export default function ConceptArtPage() {
  const [activeTab, setActiveTab] = useState<Tab>('cenario')

  return (
    <Layout title="Concept Art" description="Galeria de concept art por By Theodora D">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          <TypeWriter text="Concept Art" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />

        {/* Abas */}
        <div className="flex justify-center gap-2">
          {(['cenario', 'personagem'] as Tab[]).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded text-sm font-semibold transition-all duration-200 ${
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

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ImageGrid images={activeTab === 'cenario' ? CENARIO : PERSONAGEM} />
      </motion.div>
    </Layout>
  )
}
