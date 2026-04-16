import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/modelagem-3d', label: 'Modelagem 3D' },
  { href: '/ilustracoes', label: 'Ilustrações' },
  { href: '/concept-art', label: 'Concept Art' },
  { href: '/branding', label: 'Branding' },
  { href: '/trabalhos-fisicos', label: 'Trabalhos Físicos' },
  { href: '/sobre', label: 'Sobre' },
]

// Ícones SVG inline para os links sociais
const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const BlueSkyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 600 530" fill="currentColor">
    <path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-19.862 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.45-163.25-81.433C20.15 217.613 10 86.535 10 68.823c0-88.687 77.742-60.816 125.72-24.795z" />
  </svg>
)

const ItchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 245.371 220.736" fill="currentColor">
    <path d="M31.99 1.365C21.287 7.72.2 31.945 0 38.298v10.516C0 62.144 12.46 73.86 23.773 73.86c13.584 0 24.902-11.258 24.902-24.62 0 13.362 10.907 24.62 24.49 24.62 13.586 0 24.494-11.258 24.494-24.62 0 13.362 11.32 24.62 24.905 24.62h.098c13.586 0 24.906-11.258 24.906-24.62 0 13.362 10.907 24.62 24.49 24.62 13.584 0 24.491-11.258 24.491-24.62 0 13.362 11.32 24.62 24.906 24.62 11.313 0 23.772-11.717 23.772-25.046V38.298c-.2-6.353-21.287-30.578-31.988-36.933C181.3 0 63.396 0 31.99 1.365zm65.484 66.217c-3.944 6.55-11.298 10.975-19.78 10.975-8.502 0-15.874-4.44-19.817-11.014-3.944 6.573-11.3 11.014-19.82 11.014a22.937 22.937 0 01-5.781-.735v87.399c0 3.37 2.716 6.123 6.123 6.123h132.964c3.37 0 6.123-2.753 6.123-6.123V77.822a22.938 22.938 0 01-5.782.735c-8.5 0-15.875-4.441-19.819-11.014-3.943 6.573-11.3 11.014-19.8 11.014-8.502 0-15.875-4.441-19.818-11.014zm-30.73 49.62h68.47c3.37 0 6.123 2.754 6.123 6.123v42.836c0 3.37-2.754 6.123-6.123 6.123H66.744c-3.37 0-6.123-2.754-6.123-6.123v-42.836c0-3.37 2.754-6.123 6.123-6.123z" />
  </svg>
)

export default function Header() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="w-full bg-bg/95 backdrop-blur-sm border-b border-bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo / nome */}
        <Link href="/" className="font-display text-accent text-xl font-bold tracking-widest hover:opacity-80 transition-opacity flex-shrink-0">
          by.TheodoraD
        </Link>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1 flex-wrap">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = router.pathname === href
            return (
              <motion.div key={href} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={href}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-accent border border-accent/40 bg-accent/10'
                      : 'text-foreground-muted hover:text-foreground hover:bg-bg-card'
                  }`}
                >
                  {label}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Links sociais + botão contato */}
        <div className="hidden lg:flex items-center gap-3">
          <motion.a
            href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
            className="text-foreground-muted hover:text-accent transition-colors"
            whileHover={{ scale: 1.15 }} title="LinkedIn"
          >
            <LinkedInIcon />
          </motion.a>
          <motion.a
            href="https://bsky.app" target="_blank" rel="noopener noreferrer"
            className="text-foreground-muted hover:text-accent transition-colors"
            whileHover={{ scale: 1.15 }} title="BlueSky"
          >
            <BlueSkyIcon />
          </motion.a>
          <motion.a
            href="https://itch.io" target="_blank" rel="noopener noreferrer"
            className="text-foreground-muted hover:text-accent transition-colors"
            whileHover={{ scale: 1.15 }} title="Itch.io"
          >
            <ItchIcon />
          </motion.a>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/contato"
              className="ml-2 px-4 py-1.5 bg-accent text-bg rounded text-sm font-semibold hover:bg-accent-light transition-colors duration-200"
            >
              Contato
            </Link>
          </motion.div>
        </div>

        {/* Hamburger mobile */}
        <button
          className="lg:hidden text-foreground-muted hover:text-foreground p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-bg-card bg-bg overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-3 gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    router.pathname === href
                      ? 'text-accent bg-accent/10'
                      : 'text-foreground-muted hover:text-foreground hover:bg-bg-card'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/contato"
                onClick={() => setMenuOpen(false)}
                className="mt-2 px-4 py-2 bg-accent text-bg rounded text-sm font-semibold text-center"
              >
                Contato
              </Link>
              <div className="flex items-center gap-4 mt-3 px-3 pb-2">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-accent"><LinkedInIcon /></a>
                <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-accent"><BlueSkyIcon /></a>
                <a href="https://itch.io" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-accent"><ItchIcon /></a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
