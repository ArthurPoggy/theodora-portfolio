import { useState, useRef, FormEvent } from 'react'
import emailjs from '@emailjs/browser'
import { motion } from 'framer-motion'

const MAX_CHARS = 1000

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: nome,
          from_email: email,
          message: mensagem,
          subject: `[MENSAGEM DIRETA DO SITE] ${nome}`,
          to_email: process.env.NEXT_PUBLIC_ARTIST_EMAIL,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )
      setStatus('success')
      setNome('')
      setEmail('')
      setMensagem('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 w-full max-w-xl mx-auto">
      {/* Nome */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-foreground-muted mb-1.5">
          Nome <span className="text-accent">*</span>
        </label>
        <input
          id="nome"
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="w-full bg-bg-card border border-bg-hover rounded-lg px-4 py-3 text-foreground text-sm placeholder-foreground-muted/50 focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground-muted mb-1.5">
          Email <span className="text-accent">*</span>
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full bg-bg-card border border-bg-hover rounded-lg px-4 py-3 text-foreground text-sm placeholder-foreground-muted/50 focus:outline-none focus:border-accent/60 transition-colors"
        />
      </div>

      {/* Mensagem */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label htmlFor="mensagem" className="block text-sm font-medium text-foreground-muted">
            Mensagem <span className="text-accent">*</span>
          </label>
          <span className={`text-xs ${mensagem.length > MAX_CHARS * 0.9 ? 'text-accent' : 'text-foreground-muted'}`}>
            {mensagem.length}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          id="mensagem"
          required
          value={mensagem}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setMensagem(e.target.value)
          }}
          placeholder="Fale sobre seu projeto ou ideia..."
          rows={6}
          className="w-full bg-bg-card border border-bg-hover rounded-lg px-4 py-3 text-foreground text-sm placeholder-foreground-muted/50 focus:outline-none focus:border-accent/60 transition-colors resize-none"
        />
      </div>

      {/* Botão */}
      <motion.button
        type="submit"
        disabled={status === 'sending'}
        whileHover={{ scale: status === 'sending' ? 1 : 1.02 }}
        whileTap={{ scale: status === 'sending' ? 1 : 0.98 }}
        className="w-full py-3 bg-accent text-bg font-semibold rounded-lg hover:bg-accent-light transition-colors duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? 'Enviando...' : 'Enviar mensagem'}
      </motion.button>

      {/* Feedback */}
      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-3 px-4 bg-green-900/30 border border-green-700/40 rounded-lg text-green-400 text-sm"
        >
          Mensagem enviada com sucesso! Em breve entrarei em contato.
        </motion.div>
      )}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-3 px-4 bg-red-900/30 border border-red-700/40 rounded-lg text-red-400 text-sm"
        >
          Ocorreu um erro ao enviar. Por favor, tente novamente ou entre em contato por email diretamente.
        </motion.div>
      )}
    </form>
  )
}
