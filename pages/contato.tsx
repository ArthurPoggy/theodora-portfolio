import Layout from '@/components/Layout'
import ContactForm from '@/components/ContactForm'
import { motion } from 'framer-motion'

export default function ContatoPage() {
  const email = process.env.NEXT_PUBLIC_ARTIST_EMAIL || 'contato@theodora.art'

  return (
    <Layout title="Contato" description="Entre em contato com by.TheodoraD para projetos e colaborações">
      {/* Cabeçalho */}
      <section className="pt-14 pb-4 px-6 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold text-foreground mb-3"
        >
          Contato
        </motion.h1>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="h-0.5 w-24 bg-accent mx-auto"
        />
      </section>

      {/* Conteúdo */}
      <section className="max-w-2xl mx-auto px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-10"
        >
          <p className="text-foreground-muted text-sm leading-relaxed max-w-md mx-auto">
            Tem um projeto em mente? Adoraria ouvir sobre ele! Preencha o formulário abaixo
            e entrarei em contato o mais breve possível.
          </p>
          <p className="text-foreground-muted text-xs mt-3">
            Ou me envie um email diretamente:{' '}
            <a href={`mailto:${email}`} className="text-accent hover:underline">
              {email}
            </a>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-bg-card border border-bg-hover rounded-2xl p-8"
        >
          <ContactForm />
        </motion.div>
      </section>
    </Layout>
  )
}
