import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0f0f0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Patrick+Hand&display=swap" rel="stylesheet" />
        <meta name="description" content="Portfolio de By Theodora D — Artista visual, modelagem 3D, ilustrações e concept art." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
