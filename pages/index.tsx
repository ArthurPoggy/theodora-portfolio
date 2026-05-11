import { GetStaticProps } from 'next'
import Layout from '@/components/Layout'
import MarqueeGallery from '@/components/MarqueeGallery'
import Testimonials from '@/components/Testimonials'
import Win98Window from '@/components/Win98Window'
import TypeWriter from '@/components/TypeWriter'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { HomeData, Testimonial } from '@/types/cms'
import homeData from '@/data/home.json'
import testimonialsData from '@/data/testimonials.json'

const GALLERY_PAGES = [
  { href: '/modelagem-3d', label: 'Modelagem 3D' },
  { href: '/ilustracoes', label: 'Ilustrações' },
  { href: '/concept-art', label: 'Concept Art' },
  { href: '/animacoes', label: 'Animações' },
  { href: '/trabalhos-fisicos', label: 'Trabalhos Físicos' },
  { href: '/encomendados', label: 'Encomendados' },
]

interface Props {
  home: HomeData
  testimonials: Testimonial[]
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {
      home: homeData as HomeData,
      testimonials: testimonialsData as Testimonial[],
    },
  }
}

export default function HomePage({ home, testimonials }: Props) {
  return (
    <Layout
      title="Home"
      description="Portfolio de By Theodora D. — artista visual especializada em modelagem 3D, ilustrações, concept art e animações."
    >
      {/* ── HERO em janela Windows 98 ── */}
      <section className="py-12">
        <div className="px-4 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <Win98Window title="by_theodora_d.exe" className="w-full">
            <div className="bg-bg flex flex-col lg:flex-row items-center gap-10 p-8">
              {/* Foto */}
              <div className="relative w-56 h-56 lg:w-72 lg:h-72 rounded-xl overflow-hidden border-2 border-accent/40 flex-shrink-0">
                <Image
                  src="/images/artista.svg"
                  alt="By Theodora D."
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-bg-card to-accent/20 flex items-center justify-center">
                  <span className="font-display text-accent text-6xl font-bold select-none">T</span>
                </div>
              </div>

              {/* Texto */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-2">
                  <TypeWriter text={home.heroText} speed={80} />
                </h1>
                <p className="text-accent text-sm font-medium tracking-widest uppercase mb-5">
                  <TypeWriter text="Artista Visual" delay={1200} speed={60} />
                </p>
                <p className="text-foreground-muted text-base leading-relaxed mb-7">
                  {home.heroBio}
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {GALLERY_PAGES.map(({ href, label }) => (
                    <motion.div key={href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href={href}
                        className="px-3 py-1.5 border border-accent/40 text-accent text-sm rounded-xl hover:bg-accent hover:text-bg transition-all duration-200"
                      >
                        {label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Win98Window>
        </motion.div>
        </div>
      </section>

      {/* ── GALERIA MARQUEE em janela Windows 98 ── */}
      <section className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Win98Window title="galeria_trabalhos.exe" className="w-full">
            <div className="bg-bg py-6 relative">
              <h2 className="font-display text-xl text-center text-foreground mb-6 px-6">
                Trabalhos em destaque
              </h2>
              <div className="mb-4">
                <MarqueeGallery items={home.marqueeRow1} direction="left" />
              </div>
              <MarqueeGallery items={home.marqueeRow2} direction="right" />
              {/* Scrollbar horizontal decorativa Win95 */}
              <div className="flex items-center mx-4 mt-3 mb-1 h-4" style={{ background: '#c0c0c0', border: '2px solid', borderColor: '#ffffff #808080 #808080 #ffffff', outline: '1px solid #000' }}>
                <div className="flex items-center justify-center w-4 h-full flex-shrink-0 text-black select-none" style={{ fontSize: '8px', background: '#c0c0c0', border: '1px solid', borderColor: '#ffffff #808080 #808080 #ffffff' }}>◄</div>
                <div className="flex-1 h-full relative" style={{ background: 'repeating-conic-gradient(#c0c0c0 0% 25%, #a0a0a0 0% 50%) 0 0 / 4px 4px' }}>
                  <div className="absolute top-0 h-full" style={{ left: '30%', width: '40%', background: '#c0c0c0', border: '2px solid', borderColor: '#ffffff #808080 #808080 #ffffff' }} />
                </div>
                <div className="flex items-center justify-center w-4 h-full flex-shrink-0 text-black select-none" style={{ fontSize: '8px', background: '#c0c0c0', border: '1px solid', borderColor: '#ffffff #808080 #808080 #ffffff' }}>►</div>
              </div>
            </div>
          </Win98Window>
        </motion.div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <Testimonials testimonials={testimonials} />

      {/* ── CTA CONTATO ── */}
      <section className="py-16 px-6 text-center bg-bg-card mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl text-foreground mb-4">
            Vamos criar algo juntos?
          </h2>
          <p className="text-foreground-muted mb-8 max-w-md mx-auto">
            Aberta para projetos freelance, colaborações e encomendas. Entre em contato!
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/contato"
              className="inline-block px-8 py-3 bg-accent text-bg font-semibold rounded-2xl hover:bg-accent-light transition-colors duration-200 text-sm tracking-wide"
            >
              Enviar mensagem
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </Layout>
  )
}
