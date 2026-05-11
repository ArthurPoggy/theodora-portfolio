import Head from 'next/head'
import Header from './Header'
import Footer from './Footer'
import MediaOverlays from './MediaOverlays'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export default function Layout({ children, title, description }: LayoutProps) {
  const pageTitle = title
    ? `${title} — by.TheodoraD`
    : 'by.TheodoraD — Portfolio'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex flex-col min-h-screen text-foreground relative" style={{ zIndex: 1 }}>
        <Header />
        <main className="flex-1 page-transition">
          {children}
        </main>
        <Footer />
        <MediaOverlays />
      </div>
    </>
  )
}
