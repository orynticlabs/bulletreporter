import { SITE_URL } from '@/lib/seo'

const privatePaths = [
  '/admin',
  '/api',
  '/reset-password',
  '/forgot-password',
]

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'DuckDuckBot',
          'YandexBot',
          'Applebot',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'CCBot',
        ],
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
