import { addCacheVersionToUrl, getPublicCacheVersion } from '@/utils/publicCacheState'
import { getCategoryDisplayName, getCategoryRouteKey } from '@/utils/payloadCategories'

const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : ''

const PUBLIC_CACHE_TTL = 2 * 60 * 1000
const responseCache = new Map()
const pendingRequests = new Map()

const getCachedJson = async (url, ttl = PUBLIC_CACHE_TTL) => {
  const now = Date.now()
  const cached = responseCache.get(url)

  if (cached && now - cached.timestamp < ttl) {
    return cached.data
  }

  if (pendingRequests.has(url)) {
    return pendingRequests.get(url)
  }

  const request = fetch(url, {
    // URLs include the public cache version, so normal browser caching is safe:
    // when content changes, the URL changes and the browser fetches fresh data.
    cache: 'default',
    credentials: 'omit',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Payload request failed: ${response.status}`)
      }

      // Guard against non-JSON responses (e.g. an HTML error page)
      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Expected JSON but got ${contentType}`)
      }

      const data = await response.json()
      responseCache.set(url, { data, timestamp: Date.now() })
      return data
    })
    .finally(() => {
      pendingRequests.delete(url)
    })

  pendingRequests.set(url, request)
  return request
}

export const normalizeRouteSlug = (value = '') => {
  let slug = Array.isArray(value) ? value[0] : String(value || '')

  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(slug)
      if (decoded === slug) break
      slug = decoded
    } catch {
      break
    }
  }

  return slug.trim()
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const isCloudinaryUrl = (url = '') => /res\.cloudinary\.com|cloudinary\.com/.test(String(url))

const getCloudinaryCloudName = (media) => {
  const configuredName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME

  if (configuredName) return configuredName

  const cloudinaryUrl = [media?.url, media?.thumbnailURL]
    .filter(Boolean)
    .find(isCloudinaryUrl)

  if (!cloudinaryUrl) return null

  try {
    return new URL(cloudinaryUrl).pathname.split('/').filter(Boolean)[0] || null
  } catch {
    return null
  }
}

const buildCloudinaryUrl = (media, transform = 'f_auto,q_auto') => {
  if (!media?.cloudinaryPublicId) return null

  const cloudName = getCloudinaryCloudName(media)
  if (!cloudName) return null

  // Cloudinary public IDs use raw path separators — do NOT encodeURIComponent.
  // Only encode spaces (rare but possible in filenames); leave slashes, dots,
  // hyphens and underscores as-is so the URL resolves correctly.
  const publicId = String(media.cloudinaryPublicId)
    .replace(/\s+/g, '%20')          // only encode whitespace
  const transformPath = transform ? `${transform}/` : ''

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformPath}${publicId}`
}

const getMediaUrl = (media, transform = 'f_auto,q_auto,c_limit,w_900') => {
  if (!media || typeof media !== 'object') return null

  // Prefer building from cloudinaryPublicId — gives us full control over the
  // transformation and avoids the raw stored URL which may lack dimensions.
  if (media.cloudinaryPublicId) {
    const built = buildCloudinaryUrl(media, transform)
    if (built) return built
  }

  // Fallback to the original stored URL only. Do not use Payload-generated
  // image sizes; media uploads must remain a single Cloudinary asset.
  const url = media.url || media.thumbnailURL

  if (!url) return null
  return url
}

const getCloudinaryVideoUrl = (video) => {
  if (!video || typeof video !== 'object') return ''
  if (video.cloudinaryPublicId) {
    const cloudName = getCloudinaryCloudName(video)
    if (cloudName) {
      const publicId = String(video.cloudinaryPublicId).replace(/\s+/g, '%20')
      return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${publicId}`
    }
  }

  // Never expose Payload's relative /api/.../file route to public video
  // players. It is only a fallback for a fully-qualified stored URL.
  if (/^https:\/\//i.test(video.url || '') && video.mimeType?.startsWith('video/')) {
    return video.url
  }
  return ''
}

const getCloudinaryVideoPoster = (video) => {
  if (!video?.cloudinaryPublicId) return ''
  const cloudName = getCloudinaryCloudName(video)
  if (!cloudName) return ''
  const publicId = String(video.cloudinaryPublicId).replace(/\s+/g, '%20')
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,f_jpg,q_auto,c_limit,w_900/${publicId}.jpg`
}

/**
 * Returns a Cloudinary URL pre-sized for Open Graph (1200×630, JPEG).
 * Used exclusively by generateMetadata — never for <img> tags.
 */
export const getOgImageUrl = (media) => {
  if (!media || typeof media !== 'object') return null
  if (media.cloudinaryPublicId) {
    return buildCloudinaryUrl(media, 'w_1200,h_630,c_limit,f_jpg,q_auto')
  }
  // For non-Cloudinary media fall back to the stored URL as-is
  return media.url || null
}

const getRelationshipTitle = (value, fallback = '', lang = 'hi') => {
  if (!value) return fallback
  if (typeof value === 'string') return value
  return getCategoryDisplayName(value, lang) || fallback
}

const getCategoryRelationships = (value) => {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value]
}

const getCategoryDisplayValues = (value, fallback, lang = 'hi') => {
  const categoryValues = getCategoryRelationships(value)
  const categories = categoryValues
    .map((category) => getRelationshipTitle(category, '', lang))
    .filter(Boolean)
  const categorySlugs = categoryValues
    .map((category) => (typeof category === 'string' ? category : getCategoryRouteKey(category)))
    .filter(Boolean)

  return {
    category: categories[0] || fallback,
    category_slug: categorySlugs[0] || categories[0] || fallback,
    categories: categories.length ? categories : [fallback],
    category_slugs: categorySlugs.length ? categorySlugs : categories.length ? categories : [fallback],
  }
}

const getAuthorName = (value) => {
  if (!value) return 'Bullet Reporter'
  if (typeof value === 'string') return value
  return value.name || value.email || 'Bullet Reporter'
}

export const getYouTubeVideoId = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  try {
    const url = new URL(raw)
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || ''
    if (url.searchParams.get('v')) return url.searchParams.get('v') || ''

    const parts = url.pathname.split('/').filter(Boolean)
    const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part))
    if (markerIndex >= 0 && parts[markerIndex + 1]) return parts[markerIndex + 1]
  } catch {
    // Raw IDs are handled above.
  }

  return ''
}

const renderLexicalText = (node) => {
  let text = escapeHtml(node.text || '')
  const format = Number(node.format || 0)

  if (format & 16) text = `<code>${text}</code>`
  if (format & 8) text = `<u>${text}</u>`
  if (format & 4) text = `<s>${text}</s>`
  if (format & 2) text = `<em>${text}</em>`
  if (format & 1) text = `<strong>${text}</strong>`

  return text
}

const renderLexicalChildren = (children = []) =>
  children.map(renderLexicalNode).join('')

const renderLexicalNode = (node) => {
  if (!node) return ''

  if (node.type === 'text') {
    return renderLexicalText(node)
  }

  if (node.type === 'linebreak') {
    return '<br />'
  }

  if (node.type === 'heading') {
    const tag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(node.tag) ? node.tag : 'h2'
    return `<${tag}>${renderLexicalChildren(node.children)}</${tag}>`
  }

  if (node.type === 'quote') {
    return `<blockquote>${renderLexicalChildren(node.children)}</blockquote>`
  }

  if (node.type === 'list') {
    const tag = node.listType === 'number' ? 'ol' : 'ul'
    return `<${tag}>${renderLexicalChildren(node.children)}</${tag}>`
  }

  if (node.type === 'listitem') {
    return `<li>${renderLexicalChildren(node.children)}</li>`
  }

  if (node.type === 'link') {
    const href = escapeHtml(node.fields?.url || node.url || '#')
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${renderLexicalChildren(node.children)}</a>`
  }

  if (node.type === 'upload') {
    const media = node.value
    const src = getMediaUrl(media)
    if (!src) return ''
    const alt = escapeHtml(media?.alt || '')
    return `<figure><img src="${escapeHtml(src)}" alt="${alt}" loading="lazy" /></figure>`
  }

  if (node.type === 'block' && node.fields?.blockType === 'videoNews') {
    const video = node.fields.video
    if (!video || typeof video !== 'object') return ''

    const videoId = video.youtubeVideoId || getYouTubeVideoId(video.youtubeVideo)
    const uploadedVideoUrl = getCloudinaryVideoUrl(video)
    if (!videoId && !uploadedVideoUrl) return ''

    const title = escapeHtml(video.title || 'Video news')
    const slug = typeof video.slug === 'string' ? video.slug : ''
    const detailUrl = slug ? `/video-news/${encodeURIComponent(slug)}` : ''

    const player = videoId
      ? `<iframe src="https://www.youtube.com/embed/${escapeHtml(videoId)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
      : `<video src="${escapeHtml(uploadedVideoUrl)}" poster="${escapeHtml(getCloudinaryVideoPoster(video))}" title="${title}" controls preload="metadata" playsinline></video>`
    return `<figure class="embedded-video-news"><div class="embedded-video-news__player">${player}</div><figcaption>${detailUrl ? `<a href="${detailUrl}">${title}</a>` : title}</figcaption></figure>`
  }

  if (node.type === 'paragraph') {
    const children = renderLexicalChildren(node.children)
    return children.trim() ? `<p>${children}</p>` : ''
  }

  return renderLexicalChildren(node.children)
}

export const lexicalToHtml = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return renderLexicalChildren(value.root?.children || value.children || [])
}

export const lexicalToPlainText = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, ' ')

  const walk = (node) => {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (node.type === 'linebreak') return '\n'
    if (node.type === 'block' && node.fields?.blockType === 'videoNews') {
      return typeof node.fields.video === 'object' ? node.fields.video.title || '' : ''
    }
    return (node.children || []).map(walk).join(' ')
  }

  return (value.root?.children || value.children || [])
    .map(walk)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const normalizePayloadArticle = (doc, lang = 'hi', options = {}) => {
  if (!doc) return null

  // Single content field (previously English duplicate removed)
  const localizedContent = doc.content
  const contentHtml = options.summary ? '' : lexicalToHtml(localizedContent)
  const contentText = options.summary ? '' : lexicalToPlainText(localizedContent)
  const excerpt = doc.excerpt || contentText.slice(0, 180)
  const imageUrl = getMediaUrl(
    doc.featuredImage,
    options.summary ? 'f_auto,q_auto,c_limit,w_640' : 'f_auto,q_auto,c_limit,w_1200',
  )

  // category_slug  → used in URLs (always the English `name` field so the API
  //                   filter `category: { equals: id }` resolves consistently)
  // category       → display label (nameHindi when available, otherwise name)
  const categoryValues = getCategoryDisplayValues(doc.category, 'News', lang)

  const tags = Array.isArray(doc.tags)
    ? doc.tags.map((item) => item.tag).filter(Boolean)
    : []

  return {
    ...doc,
    id: doc.id,
    title: doc.title || 'Untitled',
    description: excerpt,
    content: contentHtml,
    contentText,
    category: categoryValues.category,   // primary badge / backward compatibility
    category_slug: categoryValues.category_slug, // primary category URL / backward compatibility
    categories: categoryValues.categories,
    category_slugs: categoryValues.category_slugs,
    author_name: getAuthorName(doc.author),
    editor_name: getAuthorName(doc.editor),
    created_at: doc.publishedAt || doc.createdAt || doc.created_at,
    updated_at: doc.updatedAt || doc.updated_at,
    image_url: imageUrl,
    youtube_url: doc.youtubeUrl || doc.youtube_url || null,
    is_breaking: Boolean(doc.isBreaking),
    is_featured: Boolean(doc.isFeatured),
    views: Number(doc.views || 0),
    likes: Number(doc.likes || 0),
    dislikes: Number(doc.dislikes || 0),
    tags,
    slug: doc.slug || '',
  }
}

export const normalizePayloadVideoNews = (doc, lang = 'hi') => {
  if (!doc) return null

  const contentHtml = lexicalToHtml(doc.content)
  const contentText = lexicalToPlainText(doc.content)
  const videoId = doc.youtubeVideoId || getYouTubeVideoId(doc.youtubeVideo)
  const uploadedVideoUrl = getCloudinaryVideoUrl(doc)
  const uploadedVideoPoster = getCloudinaryVideoPoster(doc)
  const thumbnailUrl = getMediaUrl(doc.thumbnail) || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : uploadedVideoPoster || null)

  const categoryValues = getCategoryDisplayValues(doc.category, 'Video News', lang)

  const tags = Array.isArray(doc.tags)
    ? doc.tags.map((item) => item.tag).filter(Boolean)
    : []

  return {
    ...doc,
    id: doc.id,
    title: doc.title || 'Untitled',
    description: doc.description || contentText.slice(0, 180),
    content: contentHtml,
    contentText,
    category: categoryValues.category,
    category_slug: categoryValues.category_slug,
    categories: categoryValues.categories,
    category_slugs: categoryValues.category_slugs,
    author_name: getAuthorName(doc.author),
    editor_name: getAuthorName(doc.editor),
    created_at: doc.publishedAt || doc.createdAt || doc.created_at,
    updated_at: doc.updatedAt || doc.updated_at,
    image_url: thumbnailUrl,
    thumbnail_url: thumbnailUrl,
    youtube_video: doc.youtubeVideo || '',
    youtube_video_id: videoId,
    youtube_embed_url: videoId ? `https://www.youtube.com/embed/${videoId}` : '',
    youtube_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : doc.youtubeVideo || '',
    uploaded_video_url: uploadedVideoUrl,
    uploaded_video_poster: uploadedVideoPoster,
    video_source: videoId ? 'youtube' : uploadedVideoUrl ? 'upload' : '',
    language: doc.language || 'hi',
    views: Number(doc.views || 0),
    likes: Number(doc.likes || 0),
    dislikes: Number(doc.dislikes || 0),
    tags,
    slug: doc.slug || '',
    type: 'video-news',
  }
}

const buildPayloadNewsUrl = (options = {}) => {
  const {
    limit = 10,
    page = 1,
    depth = 1,
    sort = '-createdAt',
    isBreaking,
    isFeatured,
    category,
  } = options
  const slug = normalizeRouteSlug(options.slug)

  const params = new URLSearchParams()
  params.set('depth', String(depth))
  params.set('limit', String(limit))
  params.set('page', String(page))
  params.set('sort', sort)
  if (typeof isBreaking === 'boolean') {
    params.set('isBreaking', String(isBreaking))
  }

  if (typeof isFeatured === 'boolean') {
    params.set('isFeatured', String(isFeatured))
  }

  if (slug) {
    params.set('slug', slug)
  }

  if (category) {
    params.set('category', category)
  }

  if (options.search) {
    params.set('search', options.search)
  }

  if (options.summary) {
    params.set('summary', 'true')
  }

  return `${PAYLOAD_API_BASE}/api/public/news?${params.toString()}`
}

export async function fetchPayloadArticles(options = {}) {
  const version = await getPublicCacheVersion('news')
  const data = await getCachedJson(addCacheVersionToUrl(buildPayloadNewsUrl(options), version), options.ttl)
  const articles = (data.docs || [])
    .map((doc) => normalizePayloadArticle(doc, options.lang || 'hi', { summary: Boolean(options.summary) }))
    .filter(Boolean)

  return {
    ...data,
    articles,
    total: data.totalDocs || articles.length,
    totalPages: data.totalPages || 1,
  }
}

export async function fetchPayloadArticleBySlug(slug, options = {}) {
  const data = await fetchPayloadArticles({ ...options, slug, limit: 1, ttl: 60 * 1000 })
  return data.articles[0] || null
}

const buildPayloadVideoNewsUrl = (options = {}) => {
  const {
    limit = 6,
    page = 1,
    depth = 1,
    sort = '-createdAt',
    category,
    lang,
  } = options
  const slug = normalizeRouteSlug(options.slug)

  const params = new URLSearchParams()
  params.set('depth', String(depth))
  params.set('limit', String(limit))
  params.set('page', String(page))
  params.set('sort', sort)

  if (slug) params.set('slug', slug)
  if (category) params.set('category', category)
  if (lang) params.set('lang', lang)
  if (options.search) params.set('search', options.search)

  return `${PAYLOAD_API_BASE}/api/public/video-news?${params.toString()}`
}

export async function fetchPayloadVideoNews(options = {}) {
  const version = await getPublicCacheVersion('videoNews')
  const data = await getCachedJson(addCacheVersionToUrl(buildPayloadVideoNewsUrl(options), version), options.ttl)
  const videos = (data.docs || [])
    .map((doc) => normalizePayloadVideoNews(doc, options.lang || 'hi'))
    .filter(Boolean)

  return {
    ...data,
    videos,
    total: data.totalDocs || videos.length,
    totalPages: data.totalPages || 1,
  }
}

export async function fetchPayloadVideoNewsBySlug(slug, options = {}) {
  const data = await fetchPayloadVideoNews({ ...options, slug, limit: 1, ttl: 60 * 1000 })
  return data.videos[0] || null
}
