/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Vercel Blob CDN (uploads públicos)
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // ImageKit (camada de transformação)
      { protocol: 'https', hostname: 'ik.imagekit.io' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        // Permite que páginas do próprio site sejam carregadas em iframes (editor admin)
        source: '/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ]
  },
};

module.exports = nextConfig;
