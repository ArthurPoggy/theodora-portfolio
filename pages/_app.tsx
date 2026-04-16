import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import '@/styles/globals.css'

// Rastreamento de cliques por página via localStorage
export function trackPageVisit(page: string) {
  if (typeof window === 'undefined') return
  const data = JSON.parse(localStorage.getItem('pageStats') || '{}')
  data[page] = (data[page] || 0) + 1
  localStorage.setItem('pageStats', JSON.stringify(data))
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Rastrear a página atual ao carregar e ao navegar
    trackPageVisit(router.pathname)
    const handleRouteChange = (url: string) => trackPageVisit(url)
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => router.events.off('routeChangeComplete', handleRouteChange)
  }, [router])

  return <Component {...pageProps} />
}
