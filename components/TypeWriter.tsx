import { useEffect, useRef, useState } from 'react'

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
  const [done, setDone] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let index = 0
    setDisplayed('')
    setDone(false)

    const startTimeout = setTimeout(() => {
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
  }, [mounted, text, delay, speed])

  if (!mounted) return <span className={className}>{text}</span>

  return (
    <span className={className}>
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
