import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface TypeWriterProps {
  text: string
  className?: string
  delay?: number
  speed?: number
}

export default function TypeWriter({
  text,
  className = '',
  delay = 0,
  speed = 60,
}: TypeWriterProps) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)

  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView || started) return
    setStarted(true)

    const startTimeout = setTimeout(() => {
      let index = 0

      const interval = setInterval(() => {
        index += 1
        setDisplayed(text.slice(0, index))

        if (index >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [isInView, started, text, delay, speed])

  return (
    <span ref={ref} className={className}>
      {displayed}
      {!done && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            animation: 'tw-blink 0.7s step-end infinite',
            marginLeft: '1px',
          }}
        >
          |
          <style>{`
            @keyframes tw-blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
          `}</style>
        </span>
      )}
    </span>
  )
}
