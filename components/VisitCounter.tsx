import { useEffect, useState } from 'react'

interface VisitCounterProps {
  className?: string
}

export default function VisitCounter({ className = '' }: VisitCounterProps) {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch('https://api.countapi.xyz/hit/theodora-portfolio/visits')
      .then((res) => {
        if (!res.ok) throw new Error('countapi error')
        return res.json() as Promise<{ value: number }>
      })
      .then((data) => {
        if (!cancelled) setCount(data.value)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) return null

  const formatted =
    count === null
      ? '— visitas'
      : `${count.toLocaleString('pt-BR')} visitas`

  return (
    <span className={className} aria-live="polite">
      {formatted}
    </span>
  )
}
