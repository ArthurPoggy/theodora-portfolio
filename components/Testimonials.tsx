import { motion } from 'framer-motion'

interface Testimonial {
  text: string
  author: string
  role?: string
}

// Depoimentos placeholder — substituir com depoimentos reais
const TESTIMONIALS: Testimonial[] = [
  {
    text: 'O trabalho da Theodora superou todas as minhas expectativas. A atenção aos detalhes e a criatividade são incomparáveis.',
    author: 'Cliente Anônimo',
    role: 'Projeto de Branding',
  },
  {
    text: 'Entregou exatamente o que precisávamos para o nosso jogo. A concept art ficou incrível e dentro do prazo.',
    author: 'Estúdio Indie',
    role: 'Concept Art para Game',
  },
  {
    text: 'Profissional excepcional. As ilustrações deram vida ao nosso projeto de uma forma que não esperávamos.',
    author: 'Editor',
    role: 'Projeto Editorial',
  },
]

export default function Testimonials() {
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="font-display text-3xl text-center text-foreground mb-12"
      >
        O que dizem sobre meu trabalho
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-bg-card border border-bg-hover rounded-xl p-6 flex flex-col gap-4"
          >
            {/* Aspas decorativas */}
            <span className="text-accent text-4xl font-display leading-none select-none">&ldquo;</span>
            <p className="text-foreground-muted text-sm leading-relaxed flex-1">{t.text}</p>
            <div className="border-t border-bg-hover pt-4">
              <p className="text-foreground font-semibold text-sm">{t.author}</p>
              {t.role && <p className="text-accent text-xs mt-0.5">{t.role}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
