import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import OptimizedImage from '@/components/OptimizedImage'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Win98Window from '@/components/Win98Window'
import type { AboutData } from '@/types/cms'
import { getCmsData } from '@/lib/cms-server'

interface Props { about: AboutData }

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = await getCmsData<AboutData>('about')
  return { props: { about: data }, revalidate: 30 }
}

export default function SobrePage({ about }: Props) {
  return (
    <Layout title="Sobre a Artista" description="Conheça by.TheodoraD — artista visual">
      <section className="py-12">
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full"
          >
            <Win98Window title="sobre_a_artista.exe" className="w-full">
              <div className="bg-bg flex flex-col lg:flex-row gap-10 p-8 items-start">
                {/* Foto */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex-shrink-0 w-full lg:w-64"
                >
                  <div className="relative w-full aspect-square overflow-hidden border-2 border-accent/30">
                    <OptimizedImage source={{ src: about.photoSrc, alt: 'by.TheodoraD' }} purpose="grid" fill className="object-cover" priority />
                  </div>
                </motion.div>

                {/* Texto */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  className="flex-1"
                >
                  <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    Olá, sou Theodora D.!
                  </h1>
                  <p className="text-accent text-sm tracking-widest uppercase mb-6">Artista Visual</p>

                  <div className="space-y-4 text-foreground-muted leading-relaxed text-sm">
                    {about.bio.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h2 className="text-foreground font-semibold text-sm tracking-wider uppercase mb-4">
                      Habilidades &amp; Ferramentas
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {about.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 text-xs bg-bg-card border border-bg-hover text-foreground-muted hover:border-accent/50 hover:text-accent transition-colors duration-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Link href="/contato" className="inline-block px-6 py-2.5 bg-accent text-bg font-semibold hover:bg-accent-light transition-colors text-sm">
                        Entre em contato
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Link href="/" className="inline-block px-6 py-2.5 border border-accent/40 text-accent font-semibold hover:bg-accent/10 transition-colors text-sm">
                        Ver portfolio
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </Win98Window>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
