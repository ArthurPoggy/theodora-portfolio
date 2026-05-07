import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import '@/styles/globals.css'
import Sparkles from '@/components/Sparkles'
import MusicPlayer from '@/components/MusicPlayer'
import Win98Scrollbar from '@/components/Win98Scrollbar'
import CustomCursor from '@/components/CustomCursor'
import type { Track } from '@/types/cms'

export function trackPageVisit(page: string) {
  if (typeof window === 'undefined') return
  const data = JSON.parse(localStorage.getItem('pageStats') || '{}')
  data[page] = (data[page] || 0) + 1
  localStorage.setItem('pageStats', JSON.stringify(data))
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [tracks, setTracks] = useState<Track[]>([])

  useEffect(() => {
    fetch('/api/public/tracks')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTracks(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    trackPageVisit(router.pathname)
    const handleRouteChange = (url: string) => trackPageVisit(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router])

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: "url('/bg.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', pointerEvents: 'none' }} />
      <CustomCursor />
      <Sparkles count={18} />
      <Win98Scrollbar />
      <Component {...pageProps} />
      <MusicPlayer tracks={tracks} />
    </>
  )
}
