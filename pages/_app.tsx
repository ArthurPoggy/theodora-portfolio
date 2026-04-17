import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import '@/styles/globals.css'
import Sparkles from '@/components/Sparkles'
import MusicPlayer from '@/components/MusicPlayer'

export function trackPageVisit(page: string) {
  if (typeof window === 'undefined') return
  const data = JSON.parse(localStorage.getItem('pageStats') || '{}')
  data[page] = (data[page] || 0) + 1
  localStorage.setItem('pageStats', JSON.stringify(data))
}

// Playlist vazia por enquanto — artista vai enviar as músicas
const TRACKS: { title: string; artist?: string; src: string }[] = []

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    trackPageVisit(router.pathname)
    const handleRouteChange = (url: string) => trackPageVisit(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router])

  return (
    <>
      <Sparkles count={18} />
      <Component {...pageProps} />
      <MusicPlayer tracks={TRACKS} />
    </>
  )
}
