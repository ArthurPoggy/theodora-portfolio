import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { isAuthenticated } from '@/lib/auth'
import type {
  GalleriesData, AnimationsData, AboutData,
  Testimonial, Track, HomeData, SocialLinks, OverlaysData,
} from '@/types/cms'
import GalleryEditor from '@/components/admin/GalleryEditor'
import VideoEditor from '@/components/admin/VideoEditor'
import TextEditor from '@/components/admin/TextEditor'
import SkillsEditor from '@/components/admin/SkillsEditor'
import TestimonialsEditor from '@/components/admin/TestimonialsEditor'
import TracksEditor from '@/components/admin/TracksEditor'
import OverlaysEditor from '@/components/admin/OverlaysEditor'
import ImageUploader from '@/components/admin/ImageUploader'
import SaveButton from '@/components/admin/SaveButton'

type Section = 'galerias' | 'animacoes' | 'sobre' | 'depoimentos' | 'playlist' | 'home' | 'sociais' | 'midias'
type GalleryKey = 'modelagem3d' | 'ilustracoes' | 'cenario' | 'personagem' | 'trabalhosFisicos' | 'encomendados' | 'branding' | 'nsfw'

const GALLERY_LABELS: Record<GalleryKey, string> = {
  modelagem3d: 'Modelagem 3D', ilustracoes: 'Ilustrações', cenario: 'Concept Art — Cenário',
  personagem: 'Concept Art — Personagem', trabalhosFisicos: 'Trabalhos Físicos',
  encomendados: 'Encomendados', branding: 'Branding Jobs', nsfw: 'NSFW',
}

const GALLERY_DIRS: Record<GalleryKey, string> = {
  modelagem3d: '3d', ilustracoes: 'ilustracoes', cenario: 'concept', personagem: 'concept',
  trabalhosFisicos: 'fisico', encomendados: 'encomendados', branding: 'branding', nsfw: 'nsfw',
}

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
  const [section, setSection] = useState<Section>('galerias')
  const [activeGallery, setActiveGallery] = useState<GalleryKey>('modelagem3d')

  // Data states
  const [galleries, setGalleries] = useState<GalleriesData | null>(null)
  const [animations, setAnimations] = useState<AnimationsData | null>(null)
  const [about, setAbout] = useState<AboutData | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[] | null>(null)
  const [tracks, setTracks] = useState<Track[] | null>(null)
  const [home, setHome] = useState<HomeData | null>(null)
  const [social, setSocial] = useState<SocialLinks | null>(null)
  const [overlays, setOverlays] = useState<OverlaysData | null>(null)

  // Save states
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const sectionDataMap: Record<Section, unknown> = {
    galerias: galleries, animacoes: animations, sobre: about,
    depoimentos: testimonials, playlist: tracks, home, sociais: social,
    midias: overlays,
  }

  const load = useCallback(async (sec: Section) => {
    const key = sec === 'galerias' ? 'galleries' : sec === 'depoimentos' ? 'testimonials' : sec === 'playlist' ? 'tracks' : sec === 'sociais' ? 'social' : sec === 'animacoes' ? 'animations' : sec === 'sobre' ? 'about' : sec === 'midias' ? 'overlays' : sec
    try {
      const res = await fetch(`/api/admin/data/${key}`, { credentials: 'include' })
      const json = await res.json()
      if (!json.ok) return
      if (sec === 'galerias') setGalleries(json.data)
      else if (sec === 'animacoes') setAnimations(json.data)
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
    const key = section === 'galerias' ? 'galleries' : section === 'depoimentos' ? 'testimonials' : section === 'playlist' ? 'tracks' : section === 'sociais' ? 'social' : section === 'animacoes' ? 'animations' : section === 'sobre' ? 'about' : section === 'midias' ? 'overlays' : section
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

  if (!authed) return <LoginForm onLogin={() => { setAuthed(true) }} />

  const NAV: { key: Section; label: string }[] = [
    { key: 'galerias', label: 'Galerias' },
    { key: 'animacoes', label: 'Animações' },
    { key: 'sobre', label: 'Sobre' },
    { key: 'depoimentos', label: 'Depoimentos' },
    { key: 'playlist', label: 'Playlist' },
    { key: 'home', label: 'Home' },
    { key: 'sociais', label: 'Redes Sociais' },
    { key: 'midias', label: 'Mídias' },
  ]

  return (
    <div className="admin-page min-h-screen bg-bg font-body" style={{ fontFamily: 'Patrick Hand, cursive' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg border-b border-bg-card flex items-center justify-between px-6 py-3">
        <span className="font-display text-accent font-bold tracking-widest">CMS — By Theodora D.</span>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" className="text-foreground-muted hover:text-foreground text-sm transition-colors">Ver site ↗</a>
          <button onClick={logout} className="text-foreground-muted hover:text-foreground text-sm transition-colors">Sair</button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 border-r border-bg-card bg-bg py-6 px-3 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                section === n.key ? 'bg-accent/20 text-accent' : 'text-foreground-muted hover:text-foreground hover:bg-bg-card'
              }`}
            >
              {n.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 px-8 py-8 max-w-4xl">
          {/* ── GALERIAS ── */}
          {section === 'galerias' && galleries && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Galerias</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {(Object.keys(GALLERY_LABELS) as GalleryKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setActiveGallery(k)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${activeGallery === k ? 'bg-accent text-bg' : 'border border-accent/30 text-accent hover:bg-accent/10'}`}
                  >
                    {GALLERY_LABELS[k]}
                  </button>
                ))}
              </div>
              <GalleryEditor
                key={activeGallery}
                targetDir={GALLERY_DIRS[activeGallery]}
                images={
                  activeGallery === 'cenario' ? galleries.conceptArt.cenario :
                  activeGallery === 'personagem' ? galleries.conceptArt.personagem :
                  galleries[activeGallery as keyof Omit<GalleriesData, 'conceptArt'>] ?? []
                }
                onChange={(imgs) => {
                  if (activeGallery === 'cenario')
                    setGalleries({ ...galleries, conceptArt: { ...galleries.conceptArt, cenario: imgs } })
                  else if (activeGallery === 'personagem')
                    setGalleries({ ...galleries, conceptArt: { ...galleries.conceptArt, personagem: imgs } })
                  else
                    setGalleries({ ...galleries, [activeGallery]: imgs })
                }}
              />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── ANIMAÇÕES ── */}
          {section === 'animacoes' && animations && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Animações</h2>
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mb-3">GIFs</h3>
              <GalleryEditor
                targetDir="gifs"
                images={animations.gifs}
                onChange={(gifs) => setAnimations({ ...animations, gifs })}
              />
              <h3 className="text-foreground font-semibold text-sm uppercase tracking-wider mt-8 mb-3">Vídeos</h3>
              <VideoEditor
                videos={animations.videos}
                onChange={(videos) => setAnimations({ ...animations, videos })}
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
                <img src={about.photoSrc} alt="Artista" className="w-20 h-20 rounded-xl object-cover border border-accent/30" />
                <ImageUploader
                  onUpload={(src) => setAbout({ ...about, photoSrc: src })}
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
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Playlist</h2>
              <p className="text-foreground-muted text-sm mb-6">Envie arquivos .mp3 — eles ficarão em /audio/ no site.</p>
              <TracksEditor tracks={tracks} onChange={setTracks} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
            </div>
          )}

          {/* ── HOME ── */}
          {section === 'home' && home && (
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Página Inicial</h2>
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
              <p className="text-foreground-muted text-xs italic">Os itens do carrossel (marquee) são editados automaticamente quando você atualiza as galerias.</p>
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
                Adicione imagens, GIFs ou vídeos em qualquer página do site. Posicione com inputs numéricos.
                Ajuste fino visual (drag/resize/rotate) chega na próxima fase.
              </p>
              <OverlaysEditor data={overlays} onChange={setOverlays} />
              <SaveButton onClick={save} saving={saving} message={saveMsg} />
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
