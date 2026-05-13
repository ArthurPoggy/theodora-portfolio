import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import '@/styles/globals.css'
import Sparkles from '@/components/Sparkles'
import MusicPlayer from '@/components/MusicPlayer'
import Win98Scrollbar from '@/components/Win98Scrollbar'
import CustomCursor from '@/components/CustomCursor'
import { OverlaysProvider } from '@/components/OverlaysContext'
import type { Track } from '@/types/cms'
import { fetchWithCache } from '@/lib/session-cache'

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
    fetchWithCache<Track[]>('cms:tracks', '/api/public/tracks').then((data) => {
      if (Array.isArray(data)) setTracks(data)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  useEffect(() => {
    trackPageVisit(router.pathname)
    const handleRouteChange = (url: string) => {
      trackPageVisit(url)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router])

  const isAdmin = router.pathname === '/admin'

  // bg.png agora vem do CSS (::before em html) — evita recriar div em cada navegação
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('admin-page-html', isAdmin)
  }, [isAdmin])

  return (
    <OverlaysProvider>
      {!isAdmin && <CustomCursor />}
      {!isAdmin && <Sparkles count={8} />}
      {!isAdmin && <Win98Scrollbar />}
      <Component {...pageProps} />
      {!isAdmin && <MusicPlayer tracks={tracks} />}
    </OverlaysProvider>
  )
}
