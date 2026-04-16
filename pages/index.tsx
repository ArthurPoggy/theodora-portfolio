import Layout from '@/components/Layout'
import MarqueeGallery from '@/components/MarqueeGallery'
import Testimonials from '@/components/Testimonials'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

// Itens do carrossel — cada item representa uma obra de uma categoria
// Adicionar imagens reais em public/images/ e atualizar os caminhos abaixo
const ROW_ONE = [
  { src: '/images/placeholder-3d-1.svg', alt: 'Modelagem 3D', href: '/modelagem-3d', category: 'Modelagem 3D' },
  { src: '/images/placeholder-ilustracao-1.svg', alt: 'Ilustração', href: '/ilustracoes', category: 'Ilustrações' },
  { src: '/images/placeholder-concept-1.svg', alt: 'Concept Art', href: '/concept-art', category: 'Concept Art' },
  { src: '/images/placeholder-fisico-1.svg', alt: 'Trabalho Físico', href: '/trabalhos-fisicos', category: 'Trabalhos Físicos' },
  { src: '/images/placeholder-3d-2.svg', alt: 'Modelagem 3D', href: '/modelagem-3d', category: 'Modelagem 3D' },
]

const ROW_TWO = [
  { src: '/images/placeholder-concept-2.svg', alt: 'Concept Art', href: '/concept-art', category: 'Concept Art' },
  { src: '/images/placeholder-ilustracao-2.svg', alt: 'Ilustração', href: '/ilustracoes', category: 'Ilustrações' },
  { src: '/images/placeholder-fisico-2.svg', alt: 'Trabalho Físico', href: '/trabalhos-fisicos', category: 'Trabalhos Físicos' },
  { src: '/images/placeholder-concept-3.svg', alt: 'Concept Art', href: '/concept-art', category: 'Concept Art' },
  { src: '/images/placeholder-3d-3.svg', alt: 'Modelagem 3D', href: '/modelagem-3d', category: 'Modelagem 3D' },
]

// Links das páginas para os botões de navegação sobre as imagens
const GALLERY_PAGES = [
  { href: '/modelagem-3d', label: 'Modelagem 3D' },
  { href: '/ilustracoes', label: 'Ilustrações' },
  { href: '/concept-art', label: 'Concept Art' },
  { href: '/trabalhos-fisicos', label: 'Trabalhos Físicos' },
]

export default function HomePage() {
  return (
    <Layout
      title="Home"
      description="Portfolio de by.TheodoraD — artista visual especializada em modelagem 3D, ilustrações, concept art e branding."
    >
      {/* ── HERO ── */}
      <section className="flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-20 max-w-7xl mx-auto">
        {/* Foto da artista */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-2xl overflow-hidden border-2 border-accent/40 flex-shrink-0"
        >
          <Image
            src="/images/artista.svg"
            alt="by.TheodoraD"
            fill
            className="object-cover"
            priority
          />
          {/* Fallback colorido enquanto sem foto */}
          <div className="absolute inset-0 bg-gradient-to-br from-bg-card to-accent/20 flex items-center justify-center">
            <span className="font-display text-accent text-6xl font-bold select-none">T</span>
          </div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-xl text-center lg:text-left"
        >
          <h1 className="font-display text-5xl lg:text-6xl font-bold text-foreground mb-2">
            By Theodora D
          </h1>
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-6">
            Artista Visual
          </p>
          <p className="text-foreground-muted text-base leading-relaxed mb-8">
            Olá! Sou Theodora, artista visual apaixonada por criar mundos através da modelagem 3D,
            ilustrações, concept art e identidades visuais. Cada projeto é uma nova aventura criativa.
          </p>
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {GALLERY_PAGES.map(({ href, label }) => (
              <motion.div key={href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={href}
                  className="px-4 py-2 border border-accent/40 text-accent text-sm rounded hover:bg-accent hover:text-bg transition-all duration-200"
                >
                  {label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── GALERIA MARQUEE ── */}
      <section className="py-12 overflow-hidden">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-2xl text-center text-foreground mb-8 px-6"
        >
          Trabalhos em destaque
        </motion.h2>

        {/* Fileira 1 — desliza para a esquerda */}
        <div className="mb-4">
          <MarqueeGallery items={ROW_ONE} direction="left" />
        </div>

        {/* Fileira 2 — desliza para a direita */}
        <div>
          <MarqueeGallery items={ROW_TWO} direction="right" />
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <Testimonials />

      {/* ── CTA CONTATO ── */}
      <section className="py-20 px-6 text-center bg-bg-card mt-8">
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
              className="inline-block px-8 py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent-light transition-colors duration-200 text-sm tracking-wide"
            >
              Enviar mensagem
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </Layout>
  )
}
