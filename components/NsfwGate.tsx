import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'

interface NsfwGateProps {
  children: React.ReactNode
}

function calcAge(y: number, m: number, d: number): number {
  const today = new Date()
  const dob = new Date(y, m - 1, d)
  let age = today.getFullYear() - dob.getFullYear()
  const beforeBirthday =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export default function NsfwGate({ children }: NsfwGateProps) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState<boolean | null>(null)
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('nsfw-confirmed')
    setConfirmed(stored === 'true')
  }, [])

  const handleConfirm = () => {
    setError('')
    const d = parseInt(day, 10)
    const m = parseInt(month, 10)
    const y = parseInt(year, 10)
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) {
      setError('Preencha todos os campos.')
      return
    }
    if (y < 1900 || y > new Date().getFullYear()) {
      setError('Ano inválido.')
      return
    }
    if (m < 1 || m > 12) {
      setError('Mês inválido.')
      return
    }
    if (d < 1 || d > 31) {
      setError('Dia inválido.')
      return
    }
    const dob = new Date(y, m - 1, d)
    if (isNaN(dob.getTime()) || dob.getDate() !== d || dob.getMonth() !== m - 1) {
      setError('Data inválida.')
      return
    }
    const age = calcAge(y, m, d)
    if (age < 18) {
      setError('Você precisa ter 18 anos ou mais para acessar este conteúdo.')
      return
    }
    localStorage.setItem('nsfw-confirmed', 'true')
    localStorage.setItem('nsfw-dob', `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    setConfirmed(true)
  }

  const handleBack = () => {
    router.back()
  }

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
          className="bg-bg-card border border-accent rounded-2xl p-8 sm:p-10 max-w-md w-full text-center flex flex-col gap-6"
        >
          <div>
            <p className="text-4xl mb-3">⚠️</p>
            <h2 className="font-display text-2xl font-bold text-accent mb-2">
              Conteúdo adulto
            </h2>
            <p className="text-foreground-muted text-sm leading-relaxed">
              Esta seção contém conteúdo NSFW. Informe sua data de nascimento para confirmar que tem 18 anos ou mais.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-foreground-muted text-xs uppercase tracking-wider self-start">
              Data de nascimento
            </label>
            <div className="flex gap-2 justify-center">
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD"
                maxLength={2}
                value={day}
                onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))}
                className="w-16 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-center text-foreground text-base focus:outline-none focus:border-accent/60"
              />
              <span className="self-center text-foreground-muted">/</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={month}
                onChange={(e) => setMonth(e.target.value.replace(/\D/g, ''))}
                className="w-16 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-center text-foreground text-base focus:outline-none focus:border-accent/60"
              />
              <span className="self-center text-foreground-muted">/</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="AAAA"
                maxLength={4}
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
                className="w-24 bg-bg border border-bg-hover rounded-lg px-3 py-2 text-center text-foreground text-base focus:outline-none focus:border-accent/60"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleConfirm}
              className="bg-accent text-bg font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Entrar
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
