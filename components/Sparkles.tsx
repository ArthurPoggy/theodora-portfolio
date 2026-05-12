import { useEffect, useMemo, useState } from 'react'

interface SparkleConfig {
  id: number
  top: string
  left: string
  size: number
  delay: number
  duration: number
  opacity: number
}

interface SparklesProps {
  count?: number
}

function generateSparkles(count: number): SparkleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 10 + 6,
    delay: Math.random() * 6,
    duration: Math.random() * 3 + 2,
    opacity: Math.random() * 0.5 + 0.3,
  }))
}

const StarIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#f5feff"
    aria-hidden="true"
  >
    <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" />
  </svg>
)

export default function Sparkles({ count = 8 }: SparklesProps) {
  const [mounted, setMounted] = useState(false)
  const [hidden, setHidden] = useState(false)

  const sparkles = useMemo<SparkleConfig[]>(() => {
    if (typeof window === 'undefined') return []
    return generateSparkles(count)
  }, [count])

  useEffect(() => {
    setMounted(true)
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!mounted || hidden) return null

  return (
    <>
      <style>{`
        @keyframes sparkle-pulse {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          40%  { opacity: 1; transform: scale(1) rotate(20deg); }
          70%  { opacity: 0.8; transform: scale(0.9) rotate(-10deg); }
          100% { opacity: 0; transform: scale(0) rotate(0deg); }
        }
        .sparkle-pulse { will-change: transform, opacity; }
      `}</style>

      {sparkles.map((s) => (
        <span
          key={s.id}
          aria-hidden="true"
          className="sparkle-pulse"
          style={{
            position: 'fixed',
            top: s.top,
            left: s.left,
            zIndex: 1,
            pointerEvents: 'none',
            animation: `sparkle-pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: 0,
          }}
        >
          <StarIcon size={s.size} />
        </span>
      ))}
    </>
  )
}
