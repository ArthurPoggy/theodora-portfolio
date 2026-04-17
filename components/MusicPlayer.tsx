import { useEffect, useRef, useState, useCallback } from 'react'

interface Track {
  title: string
  artist?: string
  src: string
}

interface MusicPlayerProps {
  tracks: Track[]
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)       // 0–1
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [minimized, setMinimized] = useState(false)

  const track = tracks[currentIndex] ?? null

  // Sync src when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    const wasPlaying = playing
    audio.pause()
    audio.src = track.src
    audio.load()
    setCurrentTime(0)
    setDuration(0)
    setProgress(0)
    if (wasPlaying) {
      audio.play().catch(() => setPlaying(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, track?.src])

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
  }, [])

  const handleEnded = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % tracks.length)
  }, [tracks.length])

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !track) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }, [playing, track])

  const handlePrev = useCallback(() => {
    setPlaying(false)
    setCurrentIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
  }, [tracks.length])

  const handleNext = useCallback(() => {
    setPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % tracks.length)
  }, [tracks.length])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar || !audio.duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setProgress(ratio)
    setCurrentTime(ratio * audio.duration)
  }, [])

  // Sync playing state when audio is externally paused
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPause = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    return () => {
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
    }
  }, [])

  if (tracks.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 40,
        width: minimized ? 'auto' : '280px',
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #c9a84c',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header: título do player + botão minimizar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderBottom: minimized ? 'none' : '1px solid #2a2a2a',
            background: '#111',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              color: '#c9a84c',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            ♪ player
          </span>
          <button
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expandir player' : 'Minimizar player'}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0a0',
              cursor: 'pointer',
              fontSize: '12px',
              lineHeight: 1,
              padding: '2px 4px',
              borderRadius: '3px',
            }}
          >
            {minimized ? '▲' : '▼'}
          </button>
        </div>

        {!minimized && (
          <div style={{ padding: '10px 12px 12px' }}>
            {/* Nome da música com overflow marquee */}
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
                  color: '#f5feff',
                  fontWeight: 600,
                  animation:
                    track && track.title.length > 28
                      ? 'marquee-scroll 8s linear infinite'
                      : 'none',
                }}
              >
                {track ? track.title : 'Sem faixa'}
                {track?.artist && (
                  <span style={{ color: '#a0a0a0', fontWeight: 400 }}>
                    {' '}— {track.artist}
                  </span>
                )}
              </span>
              <style>{`
                @keyframes marquee-scroll {
                  0%   { transform: translateX(0); }
                  30%  { transform: translateX(0); }
                  70%  { transform: translateX(-60%); }
                  100% { transform: translateX(0); }
                }
              `}</style>
            </div>

            {/* Barra de progresso clicável */}
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              style={{
                height: '4px',
                background: '#333',
                borderRadius: '2px',
                cursor: 'pointer',
                marginBottom: '6px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress * 100}%`,
                  background: '#c9a84c',
                  borderRadius: '2px',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>

            {/* Timestamps */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#a0a0a0',
                marginBottom: '10px',
                fontFamily: 'monospace',
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Controles */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <button
                onClick={handlePrev}
                title="Anterior"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a0a0a0',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '4px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0a0')}
              >
                ⏮
              </button>

              <button
                onClick={handlePlayPause}
                title={playing ? 'Pausar' : 'Reproduzir'}
                style={{
                  background: '#c9a84c',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#0f0f0f',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#dfc07a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#c9a84c')}
              >
                {playing ? '⏸' : '▶'}
              </button>

              <button
                onClick={handleNext}
                title="Próximo"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a0a0a0',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '4px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a84c')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0a0')}
              >
                ⏭
              </button>
            </div>
          </div>
        )}

        {/* Estado minimizado: só o botão play */}
        {minimized && (
          <div style={{ padding: '6px 12px 8px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handlePlayPause}
              title={playing ? 'Pausar' : 'Reproduzir'}
              style={{
                background: '#c9a84c',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#0f0f0f',
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
