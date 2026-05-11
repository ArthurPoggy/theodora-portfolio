import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { OverlaysData } from '@/types/cms'

const OverlaysContext = createContext<OverlaysData>({})

export function OverlaysProvider({ children }: { children: ReactNode }) {
  const [overlays, setOverlays] = useState<OverlaysData>({})

  useEffect(() => {
    fetch('/api/public/overlays')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') setOverlays(data)
      })
      .catch(() => {})
  }, [])

  return <OverlaysContext.Provider value={overlays}>{children}</OverlaysContext.Provider>
}

export function useOverlays(): OverlaysData {
  return useContext(OverlaysContext)
}
