import Layout from '@/components/Layout'
import { useEffect, useState } from 'react'

const PAGE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/modelagem-3d': 'Modelagem 3D',
  '/ilustracoes': 'Ilustrações',
  '/concept-art': 'Concept Art',
  '/branding': 'Branding Jobs',
  '/trabalhos-fisicos': 'Trabalhos Físicos',
  '/sobre': 'Sobre a Artista',
  '/contato': 'Contato',
}

export default function StatsPage() {
  const [stats, setStats] = useState<Record<string, number>>({})

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('pageStats') || '{}')
    setStats(data)
  }, [])

  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  const sorted = Object.entries(stats).sort(([, a], [, b]) => b - a)

  return (
    <Layout title="Estatísticas" description="Estatísticas de visitas do portfolio">
      <section className="pt-14 pb-4 px-6 max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-foreground mb-2">Estatísticas de visitas</h1>
        <p className="text-foreground-muted text-sm mb-8">Dados armazenados localmente neste navegador.</p>

        {total === 0 ? (
          <p className="text-foreground-muted">Nenhuma visita registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {sorted.map(([page, count]) => {
              const pct = Math.round((count / total) * 100)
              const label = PAGE_LABELS[page] || page
              return (
                <div key={page} className="bg-bg-card rounded-xl p-4 border border-bg-hover">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-foreground font-medium text-sm">{label}</span>
                    <span className="text-accent font-bold text-sm">{count} visitas</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-right text-foreground-muted text-xs mt-1">{pct}%</p>
                </div>
              )
            })}
            <div className="pt-4 border-t border-bg-hover text-right">
              <span className="text-foreground-muted text-sm">Total: </span>
              <span className="text-foreground font-bold">{total} visitas</span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.removeItem('pageStats')
            setStats({})
          }}
          className="mt-8 px-4 py-2 border border-red-800/50 text-red-400 text-xs rounded hover:bg-red-900/20 transition-colors"
        >
          Resetar estatísticas
        </button>
      </section>
    </Layout>
  )
}
