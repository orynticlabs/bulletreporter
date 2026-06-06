import { cookies } from 'next/headers'
import './globals.css'
import Providers from './providers'
import JsonLd from '@/components/JsonLd'
import {
  buildMetadata,
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  websiteJsonLd,
} from '@/lib/seo'

export const metadata = {
  ...buildMetadata({
    title: {
      default: `${SITE_TITLE} - Latest Hindi News`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    path: '/',
  }),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#dc2626',
}

export default async function RootLayout({ children }) {
  // Read locale set by middleware (cookie is set when URL starts with /en/)
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'hi'
  const htmlLang = locale === 'en' ? 'en' : 'hi'

  return (
    <html lang={htmlLang} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to external origins for speed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

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
        {/* Disable Google auto-translate on Hindi pages — English pages translate naturally */}
        {htmlLang === 'hi' && <meta name="google" content="notranslate" />}
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
