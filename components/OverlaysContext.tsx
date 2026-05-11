import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { OverlaysData } from '@/types/cms'

const OverlaysContext = createContext<OverlaysData>({})

export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<OverlaysData>({})

  function fetchOverlays() {
    fetch('/api/public/overlays', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') setOverlays(data)
      })
      .catch(() => {})
  }

  // Fetch inicial
  useEffect(() => {
    fetchOverlays()
  }, [])

  // Repoll a cada 15s quando a página está visível
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchOverlays()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  // postMessage sync: aceita atualizações vindas do parent (admin editor) quando estiver em iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      const msg = e.data
      if (msg?.type === 'set-overlays' && msg.data && typeof msg.data === 'object') {
        setOverlays(msg.data)
      }
    }
    window.addEventListener('message', handleMessage)

    // Sinaliza pro parent que o iframe está pronto pra receber dados
    if (typeof window !== 'undefined' && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'overlay-iframe-ready' }, window.location.origin)
      } catch {}
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return <OverlaysContext.Provider value={overlays}>{children}</OverlaysContext.Provider>
}

export function useOverlays(): OverlaysData {
  return useContext(OverlaysContext)
}
