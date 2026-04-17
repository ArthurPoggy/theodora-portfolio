import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'

interface NsfwGateProps {
  children: React.ReactNode
}

export default function NsfwGate({ children }: NsfwGateProps) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('nsfw-confirmed')
    setConfirmed(stored === 'true')
  }, [])

  const handleConfirm = () => {
    localStorage.setItem('nsfw-confirmed', 'true')
    setConfirmed(true)
  }

  const handleBack = () => {
    router.back()
  }

  // Enquanto lê o localStorage (SSR safe), não renderiza nada
  if (confirmed === null) return null

  if (confirmed) return <>{children}</>

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-bg-card border border-accent rounded-2xl p-10 max-w-md w-full text-center flex flex-col gap-6"
        >
          <div>
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="font-display text-2xl font-bold text-accent mb-2">
              Conteúdo adulto
            </h2>
            <p className="text-foreground-muted text-sm leading-relaxed">
              Esta seção contém conteúdo NSFW (Not Safe For Work). Ao entrar, confirmo que tenho
              18 anos ou mais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleConfirm}
              className="bg-accent text-bg font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Sou maior de 18 anos — Entrar
            </button>
            <button
              onClick={handleBack}
              className="border border-accent text-accent font-semibold px-6 py-3 rounded-xl hover:bg-accent/10 transition-colors"
            >
              Voltar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
