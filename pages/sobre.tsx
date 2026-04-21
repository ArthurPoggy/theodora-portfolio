import Layout from '@/components/Layout'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const SKILLS = [
  'Modelagem 3D', 'Ilustração Digital', 'Concept Art',
  'Character Design', 'Environment Design',
  'Adobe Illustrator', 'Photoshop', 'Blender', 'Clip Studio Paint PRO',
]

export default function SobrePage() {
  return (
    <Layout title="Sobre a Artista" description="Conheça by.TheodoraD — artista visual">
      {/* Cabeçalho */}
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-6"
        >
          Sobre a Artista
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto"
        />
      </section>

      {/* Conteúdo principal */}
      <section className="max-w-5xl mx-auto px-6 py-14 flex flex-col lg:flex-row gap-14 items-start">
        {/* Foto */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-shrink-0 w-full lg:w-72"
        >
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-accent/30">
            <Image
              src="/images/artista.svg"
              alt="by.TheodoraD"
              fill
              className="object-cover"
            />
            {/* Fallback visual */}
            <div className="absolute inset-0 bg-gradient-to-br from-bg-card to-accent/20 flex items-center justify-center">
              <span className="font-display text-accent text-8xl font-bold select-none">T</span>
            </div>
          </div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex-1"
        >
          <h2 className="font-display text-3xl text-foreground mb-2">Olá, sou Theodora D!</h2>
          <p className="text-accent text-sm tracking-widest uppercase mb-6">Artista Visual</p>

          <div className="space-y-4 text-foreground-muted leading-relaxed text-sm">
            <p>
              Sou uma artista visual apaixonada pela criação de mundos e personagens. Minha jornada criativa
              começou com o desenho tradicional e evoluiu para abranger desde modelagem 3D até concept art para jogos e animações.
            </p>
            <p>
              Acredito que cada projeto tem uma história única a contar, e meu trabalho é encontrar a melhor forma visual de
              expressá-la. Seja através de uma identidade visual para uma marca, um personagem para um jogo ou uma ilustração
              para um livro — trago dedicação e criatividade em cada traço.
            </p>
            <p>
              Estou sempre aberta a novos projetos, colaborações e desafios criativos. Se você tem uma ideia e quer dar
              vida a ela, adoraria conversar!
            </p>
          </div>

          {/* Skills */}
          <div className="mt-8">
            <h3 className="text-foreground font-semibold text-sm tracking-wider uppercase mb-4">Habilidades & Ferramentas</h3>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-xs bg-bg-card border border-bg-hover text-foreground-muted rounded-full hover:border-accent/50 hover:text-accent transition-colors duration-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/contato"
                className="inline-block px-6 py-2.5 bg-accent text-bg font-semibold rounded-lg hover:bg-accent-light transition-colors text-sm"
              >
                Entre em contato
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/"
                className="inline-block px-6 py-2.5 border border-accent/40 text-accent font-semibold rounded-lg hover:bg-accent/10 transition-colors text-sm"
              >
                Ver portfolio
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </Layout>
  )
}
