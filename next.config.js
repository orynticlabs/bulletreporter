/** @type {import('next').NextConfig} */
const { withPayload } = require('@payloadcms/next/withPayload')

const nextConfig = {
  // ─── Performance ───────────────────────────────────
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ─── Images ────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],   // Modern formats = smaller size
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 3600,                   // Cache images 1 hour
  },

  // ─── Caching Headers (2000+ users ke liye CDN caching) ─
  async headers() {
    return [
      {
        // Static assets — cache aggressively
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Images — cache 1 week
        source: '/_next/image(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // Favicon & public assets
        source: '/favicon.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        // API pages — cache 60 seconds with revalidation
        source: '/(news|category)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=30' }],
      },
      {
        // Security headers
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  // ─── Redirects ──────────────────────────────────────
  async redirects() {
    return [
      // Old CRA routes → new Next.js routes
      { source: '/home', destination: '/', permanent: true },
      { source: '/breaking', destination: '/news/breaking', permanent: true },
      { source: '/all-news', destination: '/news', permanent: true },
    ]
  },

  // ─── Bundle optimization ────────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'axios',
    ],
  },

  // ─── Client packages (needed for react-quill SSR) ──
  transpilePackages: ['react-quill-new'],

  // ─── Webpack: replace node_modules CSS/SCSS with empty stub on server ──
  // (avoids "built-in-css-disabled" error — no CSS loader rules added)
  webpack: (config, { isServer }) => {
    if (isServer) {
      const { NormalModuleReplacementPlugin } = require('webpack')
      // Only null plain .css imports from node_modules JS files.
      // Payload's component styles are .scss and must compile normally so
      // Next.js can collect them into the client CSS bundle.
      config.plugins.push(
        new NormalModuleReplacementPlugin(
          /\.css$/,
          (resource) => {
            const context = resource.context || ''
            const issuer = resource.contextInfo?.issuer || ''
            const issuerIsStylesheet = /\.(css|scss|sass)$/.test(issuer)
            if (context.includes('node_modules') && !issuerIsStylesheet) {
              resource.request = require.resolve('./src/empty-module.js')
            }
          }
        )
      )
    }
    return config
  },
}

module.exports = withPayload(nextConfig)
