import Link from 'next/link'

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_ARTIST_EMAIL || 'contato@theodora.art'

  return (
    <footer className="w-full border-t border-bg-card bg-bg py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-foreground-muted text-sm">
        <span className="font-display text-accent font-semibold tracking-widest text-base">
          By Theodora D
        </span>
        <a
          href={`mailto:${email}`}
          className="hover:text-accent transition-colors duration-200"
        >
          {email}
        </a>
        <Link
          href="/contato"
          className="hover:text-accent transition-colors duration-200 underline underline-offset-4"
        >
          Entre em contato
        </Link>
      </div>
    </footer>
  )
}
