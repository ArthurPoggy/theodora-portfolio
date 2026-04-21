import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import ImageGrid from '@/components/ImageGrid'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'
import { useState } from 'react'
import type { GalleryImage, GalleriesData } from '@/types/cms'
import galleriesData from '@/data/galleries.json'

type Tab = 'cenario' | 'personagem'

interface Props {
  cenario: GalleryImage[]
  personagem: GalleryImage[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = galleriesData as GalleriesData
  return { props: { cenario: data.conceptArt.cenario, personagem: data.conceptArt.personagem } }
}

export default function ConceptArtPage({ cenario, personagem }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cenario')

  return (
    <Layout title="Concept Art" description="Galeria de concept art por By Theodora D.">
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-6"
        >
          <TypeWriter text="Concept Art" />
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto mb-8"
        />

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
        <ImageGrid images={activeTab === 'cenario' ? cenario : personagem} />
      </motion.div>
    </Layout>
  )
}
