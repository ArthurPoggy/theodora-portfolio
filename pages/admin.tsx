import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { isAuthenticated } from '@/lib/auth'
import type {
  AboutData, Testimonial, Track, HomeData, SocialLinks, OverlaysData, PagesData,
} from '@/types/cms'
import TextEditor from '@/components/admin/TextEditor'
import SkillsEditor from '@/components/admin/SkillsEditor'
import TestimonialsEditor from '@/components/admin/TestimonialsEditor'
import TracksEditor from '@/components/admin/TracksEditor'
import OverlaysEditor from '@/components/admin/OverlaysEditor'
import ImageUploader from '@/components/admin/ImageUploader'
import MarqueeEditor from '@/components/admin/MarqueeEditor'
import PagesEditor from '@/components/admin/PagesEditor'
import SaveButton from '@/components/admin/SaveButton'

type Section = 'paginas' | 'home' | 'sobre' | 'depoimentos' | 'playlist' | 'sociais' | 'midias'

// Cada seção carrega/grava 1:1 a partir da mesma key (sem mapping pt/en)
const SECTION_API_KEY: Record<Section, string> = {
  paginas: 'pages',
  home: 'home',
  sobre: 'about',
  depoimentos: 'testimonials',
  playlist: 'tracks',
  sociais: 'social',
  midias: 'overlays',
}

const SECTION_LABELS: Record<Section, string> = {
  paginas: 'Páginas',
  home: 'Home',
  sobre: 'Sobre',
  depoimentos: 'Depoimentos',
  playlist: 'Trilha sonora',
  sociais: 'Redes sociais',
  midias: 'Mídias decorativas',
}

const NAV_GROUPS: { title: string; items: Section[] }[] = [
  { title: 'Conteúdo',     items: ['paginas', 'home', 'sobre'] },
  { title: 'Componentes',  items: ['depoimentos', 'playlist', 'midias'] },
  { title: 'Configurações', items: ['sociais'] },
]

interface AdminPageProps { authed: boolean }

export const getServerSideProps: GetServerSideProps<AdminPageProps> = async ({ req }) => {
  return { props: { authed: isAuthenticated(req as Parameters<typeof isAuthenticated>[0]) } }
}

// ── Login Form ─────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.ok) { onLogin() } else { setError(json.error || 'Senha incorreta') }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-card border border-bg-hover rounded-2xl p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl text-foreground font-bold">CMS</h1>
          <p className="text-foreground-muted text-sm mt-1">By Theodora D. — Painel de administração</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoFocus
            className="w-full bg-bg border border-bg-hover rounded-lg px-4 py-3 text-foreground placeholder-foreground-muted/50 focus:outline-none focus:border-accent/60"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg font-semibold py-3 rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPage({ authed: initialAuthed }: AdminPageProps) {
  const [authed, setAuthed] = useState(initialAuthed)
  const [section, setSection] = useState<Section>('paginas')

  // Data states
  const [pages, setPages] = useState<PagesData | null>(null)
  const [about, setAbout] = useState<AboutData | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)
  const [tracks, setTracks] = useState<Track[] | null>(null)
  const [home, setHome] = useState<HomeData | null>(null)
  const [social, setSocial] = useState<SocialLinks | null>(null)
  const [overlays, setOverlays] = useState<OverlaysData | null>(null)

  // Save states
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Dev tools (oculto por padrão)
  const [showDevTools, setShowDevTools] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [migrationMsg, setMigrationMsg] = useState('')
  const [migratingIk, setMigratingIk] = useState(false)
  const [migrationIkMsg, setMigrationIkMsg] = useState('')

  const sectionDataMap: Record<Section, unknown> = {
    paginas: pages,
    home,
    sobre: about,
    depoimentos: testimonials,
    playlist: tracks,
    sociais: social,
    midias: overlays,
  }

  const load = useCallback(async (sec: Section) => {
    const key = SECTION_API_KEY[sec]
    try {
      const res = await fetch(`/api/admin/data/${key}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.ok) return
      if (sec === 'paginas') setPages(Array.isArray(json.data) ? json.data : [])
      else if (sec === 'sobre') setAbout(json.data)
      else if (sec === 'depoimentos') setTestimonials(json.data)
      else if (sec === 'playlist') setTracks(json.data)
      else if (sec === 'home') setHome(json.data)
      else if (sec === 'sociais') setSocial(json.data)
      else if (sec === 'midias') setOverlays(json.data || {})
    } catch {}
  }, [])

  useEffect(() => { if (authed) load(section) }, [authed, section, load])

  async function save() {
    const key = SECTION_API_KEY[section]
    const data = sectionDataMap[section]
    if (data === null || data === undefined) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/data/${key}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const json = await res.json()
      setSaveMsg(json.ok ? '✓ Salvo! As mudanças aparecem em até 30 segundos.' : `Erro: ${json.error}`)
    } catch (e) {
      setSaveMsg(`Erro: ${String(e)}`)
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 8000)
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setAuthed(false)
  }

  async function migrateMedia() {
    if (!confirm('Reescreve paths legados (/api/media/...) para URLs públicas. É rápido — pode rodar à vontade.')) return
    setMigrating(true)
    setMigrationMsg('Reescrevendo paths…')
    try {
      const r = await fetch('/api/admin/migrate-urls', { method: 'POST', credentials: 'include' })
      const result = await r.json()
      if (!result.ok) throw new Error(result.error || 'Falha')
      setMigrationMsg(`✓ ${result.totalReplacements} referências atualizadas. Recarregue o site em ~30s.`)
      load(section)
    } catch (e) {
      setMigrationMsg(`Erro: ${String(e)}`)
    } finally {
      setMigrating(false)
      setTimeout(() => setMigrationMsg(''), 20000)
    }
  }

  async function migrateToImagekit() {
    if (!confirm('Copia TODAS as mídias do Vercel Blob para o ImageKit e reescreve o CMS. Pode levar alguns minutos. Continuar?')) return
    setMigratingIk(true)
    setMigrationIkMsg('Migrando mídias para o ImageKit…')
    try {
      const r = await fetch('/api/admin/migrate-to-imagekit', { method: 'POST', credentials: 'include' })
      const result = await r.json()
      if (!result.ok) throw new Error(result.error || 'Falha')
      const failed = (result.uploads || []).filter((u: { status: string }) => u.status === 'error').length
      setMigrationIkMsg(`✓ ${result.blobsFound} arquivos migrados${failed ? ` (${failed} falharam)` : ''}. ${result.totalReplacements} URLs reescritas. Recarregue o site em ~30s.`)
      load(section)
    } catch (e) {
      setMigrationIkMsg(`Erro: ${String(e)}`)
    } finally {
      setMigratingIk(false)
      setTimeout(() => setMigrationIkMsg(''), 60000)
    }
  }

  if (!authed) return <LoginForm onLogin={() => { setAuthed(true) }} />

  return (
    <div className="admin-page min-h-screen bg-bg font-body" style={{ fontFamily: 'Patrick Hand, cursive' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg border-b border-bg-card flex items-center justify-between px-6 py-3">
        <span className="font-display text-accent font-bold tracking-widest">CMS — By Theodora D.</span>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noreferrer" className="text-foreground-muted hover:text-foreground text-sm transition-colors">Ver site ↗</a>
          <button onClick={logout} className="text-foreground-muted hover:text-foreground text-sm transition-colors">Sair</button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-bg-card bg-bg py-6 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <h4 className="text-foreground-muted text-[10px] uppercase tracking-widest px-3 mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((key) => (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      section === key ? 'bg-accent/20 text-accent' : 'text-foreground-muted hover:text-foreground hover:bg-bg-card'
                    }`}
                  >
                    {SECTION_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-8 px-3">
            <button
              onClick={() => setShowDevTools((v) => !v)}
              className="text-foreground-muted text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
            >
              {showDevTools ? '▼' : '▶'} Avançado
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 px-8 py-8 max-w-5xl">
          {/* ── PÁGINAS ── */}
          {section === 'paginas' && pages !== null && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Páginas</h2>
              <p className="text-foreground-muted text-sm mb-6">
                Crie, exclua e reordene as páginas do site. Cada página gera uma rota acessível em <code>/slug</code>.
              </p>
              <PagesEditor pages={pages} onChange={setPages} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── HOME ── */}
          {section === 'home' && home && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Página Inicial</h2>
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">Foto principal</h3>
              <div className="flex items-center gap-4 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={home.photoSrc || '/images/artista.svg'}
                  alt="Foto principal"
                  className="w-20 h-20 rounded-xl object-cover border border-accent/30"
                />
                <ImageUploader
                  onUpload={(result) => setHome({ ...home, photoSrc: result.src })}
                  targetDir="home"
                  label="Trocar foto"
                />
              </div>
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-2">Nome (TypeWriter)</h3>
              <input
                value={home.heroText}
                onChange={(e) => setHome({ ...home, heroText: e.target.value })}
                className="w-full bg-bg-card border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 mb-6"
              />
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-2">Texto da bio (hero)</h3>
              <textarea
                value={home.heroBio}
                onChange={(e) => setHome({ ...home, heroBio: e.target.value })}
                rows={3}
                className="w-full bg-bg-card border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50 resize-none mb-6"
              />
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">Carrossel — Linha 1</h3>
              <MarqueeEditor
                items={home.marqueeRow1}
                onChange={(marqueeRow1) => setHome({ ...home, marqueeRow1 })}
              />
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mt-8 mb-3">Carrossel — Linha 2</h3>
              <MarqueeEditor
                items={home.marqueeRow2}
                onChange={(marqueeRow2) => setHome({ ...home, marqueeRow2 })}
              />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── SOBRE ── */}
          {section === 'sobre' && about && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Sobre a Artista</h2>
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">Foto</h3>
              <div className="flex items-center gap-4 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={about.photoSrc} alt="Artista" className="w-20 h-20 rounded-xl object-cover border border-accent/30" />
                <ImageUploader
                  onUpload={(result) => setAbout({ ...about, photoSrc: result.src })}
                  targetDir="artista"
                  label="Trocar foto"
                />
              </div>
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">Bio</h3>
              <TextEditor paragraphs={about.bio} onChange={(bio) => setAbout({ ...about, bio })} label="Parágrafo" />
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mt-8 mb-3">Habilidades & Ferramentas</h3>
              <SkillsEditor skills={about.skills} onChange={(skills) => setAbout({ ...about, skills })} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── DEPOIMENTOS ── */}
          {section === 'depoimentos' && testimonials !== null && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Depoimentos</h2>
              <TestimonialsEditor testimonials={testimonials} onChange={setTestimonials} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── PLAYLIST ── */}
          {section === 'playlist' && tracks !== null && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Trilha sonora</h2>
              <p className="text-foreground-muted text-sm mb-6">Envie arquivos .mp3 — eles ficarão disponíveis no player do site.</p>
              <TracksEditor tracks={tracks} onChange={setTracks} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── SOCIAIS ── */}
          {section === 'sociais' && social && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Redes Sociais</h2>
              <div className="space-y-4 max-w-md">
                {(['linkedin', 'bluesky', 'itchio'] as (keyof SocialLinks)[]).map((key) => (
                  <div key={key}>
                    <label className="block text-foreground-muted text-xs uppercase tracking-wider mb-1 capitalize">{key}</label>
                    <input
                      type="url"
                      value={social[key]}
                      onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
                      className="w-full bg-bg-card border border-bg-hover rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent/50"
                    />
                  </div>
                ))}
              </div>
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── MÍDIAS (Overlays) ── */}
          {section === 'midias' && overlays !== null && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Mídias decorativas</h2>
              <p className="text-foreground-muted text-sm mb-6">
                Adicione imagens, GIFs ou vídeos posicionáveis livremente sobre qualquer página do site.
              </p>
              <OverlaysEditor data={overlays} onChange={setOverlays} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── AVANÇADO — ferramentas de migração ── */}
          {showDevTools && (
            <div className="mt-12 border-t border-bg-card pt-8">
              <h3 className="text-foreground-muted text-xs uppercase tracking-widest mb-4">Avançado — Ferramentas de migração</h3>

              <div className="p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-xl">
                <h4 className="text-yellow-400 font-semibold text-sm mb-1">⚡ Reescrever paths antigos</h4>
                <p className="text-foreground-muted text-xs mb-3">
                  Reescreve referências /api/media/... antigas para URLs públicas diretas do CDN.
                </p>
                <button
                  onClick={migrateMedia}
                  disabled={migrating}
                  className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-semibold rounded-lg hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
                >
                  {migrating ? 'Reescrevendo…' : 'Reescrever paths agora'}
                </button>
                {migrationMsg && <p className="text-foreground-muted text-xs mt-2">{migrationMsg}</p>}
              </div>

              <div className="mt-4 p-4 border border-accent/30 bg-accent/5 rounded-xl">
                <h4 className="text-accent font-semibold text-sm mb-1">🚀 Migrar para ImageKit</h4>
                <p className="text-foreground-muted text-xs mb-3">
                  Copia todas as mídias do Vercel Blob para o ImageKit Media Library e reescreve o CMS.
                </p>
                <button
                  onClick={migrateToImagekit}
                  disabled={migratingIk}
                  className="px-4 py-2 bg-accent/20 border border-accent/40 text-accent text-xs font-semibold rounded-lg hover:bg-accent/30 disabled:opacity-50 transition-colors"
                >
                  {migratingIk ? 'Migrando…' : 'Migrar tudo para ImageKit'}
                </button>
                {migrationIkMsg && <p className="text-foreground-muted text-xs mt-2 whitespace-pre-wrap">{migrationIkMsg}</p>}
              </div>
            </div>
          )}

          {/* Loading state */}
          {sectionDataMap[section] === null && (
            <div className="flex items-center gap-2 text-foreground-muted mt-12">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Carregando…
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
