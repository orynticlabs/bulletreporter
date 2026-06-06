import { fetchPayloadArticleBySlug, fetchPayloadArticles } from '@/utils/payloadArticles'

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
export const GEO_REGION = 'IN-MP'
export const GEO_PLACENAME = 'Rewa, Madhya Pradesh, India'
export const GEO_POSITION = '24.5362;81.3037'
export function absoluteUrl(path = '/') {
  if (!path) return SITE_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

const OG_TRANSFORM = 'w_1200,h_630,c_fill,f_jpg,q_auto'

/**
 * Ensures a Cloudinary image URL has the correct OG dimensions (1200×630 JPEG).
 *
 * If the URL already carries the OG transform it is returned unchanged (no
 * double-application). Non-Cloudinary URLs pass through as-is.
 * HTTP is always upgraded to HTTPS.
 *
 * Handled shapes:
 *   .../upload/public_id
 *   .../upload/f_auto,q_auto/public_id
 *   .../upload/folder/subdir/public_id
 *   .../upload/v1234567890/public_id
 */
function toOgImageUrl(url = '') {
  if (!url) return url

  // Always force HTTPS for social crawlers
  const httpsUrl = url.replace(/^http:\/\//, 'https://')

  // Only rewrite Cloudinary image URLs
  const uploadMarker = '/image/upload/'
  const uploadIdx    = httpsUrl.indexOf(uploadMarker)
  if (uploadIdx === -1 || !httpsUrl.includes('res.cloudinary.com')) return httpsUrl

  const base = httpsUrl.slice(0, uploadIdx + uploadMarker.length) // …/image/upload/
  const rest  = httpsUrl.slice(base.length)                        // everything after

  // If the OG transform is already present, return as-is
  if (rest.startsWith(OG_TRANSFORM + '/') || rest === OG_TRANSFORM) return httpsUrl

  // Strip any existing transform segments (segments that contain commas)
  const segments    = rest.split('/')
  let publicIdStart = 0
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].includes(',')) {
      publicIdStart = i + 1 // skip transform chunk
    } else {
      publicIdStart = i
      break
    }
  }

  const publicId = segments.slice(publicIdStart).join('/')
  if (!publicId) return httpsUrl

  return `${base}${OG_TRANSFORM}/${publicId}`
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

  // Always produce an absolute HTTPS OG image URL
  const rawImageUrl  = absoluteUrl(image || DEFAULT_IMAGE)
  const ogImageUrl   = toOgImageUrl(rawImageUrl) // applies 1200×630 JPEG transform for Cloudinary
  const secureImgUrl = ogImageUrl.replace(/^http:\/\//, 'https://')

  const cleanDescription = truncate(description || SITE_DESCRIPTION)
  const plainTitle = typeof title === 'string' ? title : title?.default || SITE_TITLE

  // Full OpenGraph image object — Next.js maps these to og:image:* tags
  const ogImages = [
    {
      url:       secureImgUrl,
      secureUrl: secureImgUrl,   // → og:image:secure_url
      width:     1200,           // → og:image:width
      height:    630,            // → og:image:height
      alt:       plainTitle,     // → og:image:alt
      type:      'image/jpeg',   // → og:image:type
    },
  ]

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
      ...(type === 'article' && { publishedTime, modifiedTime, authors }),
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      site: '@bulletreporter',
      creator: '@bulletreporter',
      title: plainTitle,
      description: cleanDescription,
      images: [{ url: secureImgUrl, alt: plainTitle }],
    },
    other: {
      'news_keywords': [...SITE_KEYWORDS, ...keywords].slice(0, 10).join(', '),
      'article:publisher': SITE_NAME,
      'built-by': CREATOR,
      'geo.region': GEO_REGION,
      'geo.placename': GEO_PLACENAME,
      'geo.position': GEO_POSITION,
      'ICBM': GEO_POSITION,
    },
  }
}

export async function fetchNewsArticle(slug) {
  if (!slug) return null

  try {
    return await fetchPayloadArticleBySlug(slug)
  } catch {
    return null
  }
}

export async function fetchNewsList(params = {}) {
  try {
    return await fetchPayloadArticles(params)
  } catch {
    return { articles: [] }
  }
}

export function newsArticleJsonLd(article, path) {
  if (!article) return null

  const title = article.title || SITE_TITLE
  const description = truncate(article.description || article.contentText || article.content || article.excerpt || SITE_DESCRIPTION, 180)
  const image = absoluteUrl(article.image_url || article.image || DEFAULT_IMAGE)

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: absoluteUrl(path),
    headline: title,
    description,
    image: [image],
    datePublished: article.created_at || article.createdAt || article.datePublished,
    dateModified: article.updated_at || article.updatedAt || article.created_at || article.createdAt || article.datePublished,
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
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Madhya Pradesh' },
      { '@type': 'AdministrativeArea', name: 'Chhattisgarh' },
      { '@type': 'Country', name: 'India' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rewa',
      addressRegion: 'Madhya Pradesh',
      addressCountry: 'IN',
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
