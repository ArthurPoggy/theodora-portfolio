import { motion } from 'framer-motion'
import type { Testimonial } from '@/types/cms'

interface TestimonialsProps {
  testimonials: Testimonial[]
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  if (!testimonials.length) return null

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="font-display text-3xl text-foreground">Tá na boca do povo.</h2>
        <p className="text-accent text-sm tracking-widest uppercase mt-2">Depoimentos</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.15 }}
            className="bg-bg-card border border-bg-hover rounded-xl p-6 flex flex-col gap-4"
          >
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
