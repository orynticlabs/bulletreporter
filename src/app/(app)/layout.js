import './globals.css'
import Providers from './providers'

export const metadata = {
  metadataBase: new URL('https://bullet-reporter.vercel.app'),
  title: {
    default: 'Bullet Reporter - ताज़ा खबरें | Latest Hindi News',
    template: '%s | Bullet Reporter',
  },
  description: 'सबसे तेज़ और विश्वसनीय हिंदी समाचार - Latest breaking news in Hindi and English',
  keywords: ['hindi news', 'breaking news', 'bullet reporter', 'ताज़ा खबरें', 'ब्रेकिंग न्यूज़'],
  authors: [{ name: 'Bullet Reporter' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'hi_IN',
    alternateLocale: ['en_IN'],
    siteName: 'Bullet Reporter',
    title: 'Bullet Reporter - ताज़ा खबरें',
    description: 'सबसे तेज़ हिंदी समाचार',
    images: [{ url: '/favicon.png', width: 512, height: 512, alt: 'Bullet Reporter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bullet Reporter - ताज़ा खबरें',
    description: 'सबसे तेज़ हिंदी समाचार',
    images: ['/favicon.png'],
  },
  // Both language alternates for SEO
  alternates: {
    canonical: '/',
    languages: { 'hi': '/', 'en': '/en' },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#dc2626',
}

export default function RootLayout({ children }) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://bullet-reporter-backend.onrender.com" />

        {/* Fonts — display=swap prevents FOIT */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* PWA */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Bullet Reporter" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
