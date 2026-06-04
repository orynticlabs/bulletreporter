import { DUMMY_ARTICLES } from '@/data/dummyArticles'

export const SITE_NAME = 'Bullet Reporter'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullet-reporter.vercel.app'
export const SITE_TITLE = 'Bullet Reporter'
export const SITE_DESCRIPTION =
  'Bullet Reporter delivers fast, reliable Hindi and English news, breaking updates, local stories, politics, sports, technology, and entertainment.'
export const SITE_KEYWORDS = [
  'Bullet Reporter',
  'Hindi news',
  'breaking news',
  'latest news India',
  'ताज़ा खबरें',
  'ब्रेकिंग न्यूज़',
  'OrynticLabs',
]
export const CREATOR = 'OrynticLabs'
export const DEFAULT_IMAGE = '/logo.png'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bullet-reporter-backend.onrender.com/api'

export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function stripHtml(value = '') {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(value = '', max = 155) {
  const text = stripHtml(value)
  if (text.length <= max) return text
  return `${text.slice(0, max - 3).trim()}...`
}

export function buildMetadata({
  title = SITE_TITLE,
  description = SITE_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors = [SITE_NAME],
  keywords = [],
  noIndex = false,
} = {}) {
  const canonical = absoluteUrl(path)
  const imageUrl = absoluteUrl(image || DEFAULT_IMAGE)
  const cleanDescription = truncate(description || SITE_DESCRIPTION)
  const plainTitle = typeof title === 'string' ? title : title?.default || SITE_TITLE

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title,
    description: cleanDescription,
    keywords: [...SITE_KEYWORDS, ...keywords],
    authors: authors.map((name) => ({ name })),
    creator: CREATOR,
    publisher: SITE_NAME,
    category: 'news',
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical,
      languages: {
        hi: canonical,
        en: canonical,
        'x-default': canonical,
      },
    },
    openGraph: {
      type,
      locale: 'hi_IN',
      alternateLocale: ['en_IN'],
      url: canonical,
      siteName: SITE_NAME,
      title: plainTitle,
      description: cleanDescription,
      publishedTime,
      modifiedTime,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: plainTitle,
      description: cleanDescription,
      images: [imageUrl],
      creator: '@bulletreporter',
    },
    other: {
      'news_keywords': [...SITE_KEYWORDS, ...keywords].slice(0, 10).join(', '),
      'article:publisher': SITE_NAME,
      'built-by': CREATOR,
    },
  }
}

export async function fetchNewsArticle(slug) {
  if (!slug) return null

  try {
    const response = await fetch(`${API_URL}/news/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export async function fetchNewsList(params = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  try {
    const response = await fetch(`${API_URL}/news?${searchParams.toString()}`, {
      next: { revalidate: 300 },
    })

    if (!response.ok) return { articles: [] }
    return response.json()
  } catch {
    return { articles: [] }
  }
}

export function getDummyArticle(slug) {
  return DUMMY_ARTICLES.find((article) => article.slug === slug)
}

export function newsArticleJsonLd(article, path) {
  if (!article) return null

  const title = article.title || SITE_TITLE
  const description = truncate(article.description || article.content || article.excerpt || SITE_DESCRIPTION, 180)
  const image = absoluteUrl(article.image_url || article.image || DEFAULT_IMAGE)

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: absoluteUrl(path),
    headline: title,
    description,
    image: [image],
    datePublished: article.created_at || article.datePublished,
    dateModified: article.updated_at || article.created_at || article.datePublished,
    author: {
      '@type': 'Person',
      name: article.author_name || article.author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl('/logo.png'),
      },
    },
    isAccessibleForFree: true,
  }
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    foundingDate: '2026',
    founder: {
      '@type': 'Organization',
      name: CREATOR,
    },
    sameAs: [SITE_URL],
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/news?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
