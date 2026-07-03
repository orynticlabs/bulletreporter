import config from '@payload-config'
import { getPayload } from 'payload'
import { absoluteUrl } from '@/lib/seo'
import { logDeploymentEvent, toLoggableError } from '@/lib/deploymentLogger'

export const revalidate = 300

const PAGE_SIZE = 100

const staticRoutes = [
  { path: '/', changeFrequency: 'hourly', priority: 1 },
  { path: '/news', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/news/breaking', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/video-news', changeFrequency: 'daily', priority: 0.85 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.4 },
]

const toDate = (value) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}

const route = ({ path, lastModified, changeFrequency, priority }) => ({
  url: absoluteUrl(path),
  lastModified: toDate(lastModified),
  changeFrequency,
  priority,
})

const getUpdatedAt = (doc) => doc.updatedAt || doc.publishedAt || doc.createdAt

async function fetchAllPublished(payload, collection) {
  const docs = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection,
      draft: true,
      overrideAccess: true,
      depth: 0,
      limit: PAGE_SIZE,
      page,
      sort: '-updatedAt',
      where: {
        status: { equals: 'published' },
      },
    })

    docs.push(...(result.docs || []))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }

  return docs
}

async function fetchAllCategories(payload) {
  const docs = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: PAGE_SIZE,
      page,
      sort: 'order',
    })

    docs.push(...(result.docs || []))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }

  return docs
}

export default async function sitemap() {
  const now = new Date()
  const routes = staticRoutes.map((item) => route({ ...item, lastModified: now }))

  try {
    const payload = await getPayload({ config })
    const [categories, news, videoNews] = await Promise.all([
      fetchAllCategories(payload),
      fetchAllPublished(payload, 'news'),
      fetchAllPublished(payload, 'video-news'),
    ])

    const categoryRoutes = categories
      .map((category) => category.slug || category.name || category.nameHindi)
      .filter(Boolean)
      .map((category) => route({
        path: `/category/${encodeURIComponent(category)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.75,
      }))

    const newsRoutes = news
      .filter((article) => article.slug)
      .flatMap((article) => [
        route({
          path: `/news/${encodeURIComponent(article.slug)}`,
          lastModified: getUpdatedAt(article),
          changeFrequency: article.isBreaking ? 'hourly' : 'daily',
          priority: article.isBreaking ? 0.95 : 0.85,
        }),
        route({
          path: `/article/${encodeURIComponent(article.slug)}`,
          lastModified: getUpdatedAt(article),
          changeFrequency: 'daily',
          priority: article.isFeatured ? 0.8 : 0.7,
        }),
      ])

    const videoNewsRoutes = videoNews
      .filter((video) => video.slug)
      .map((video) => route({
        path: `/video-news/${encodeURIComponent(video.slug)}`,
        lastModified: getUpdatedAt(video),
        changeFrequency: 'daily',
        priority: 0.8,
      }))

    logDeploymentEvent('info', 'sitemap', 'Generated dynamic sitemap routes', {
      staticRoutes: routes.length,
      categoryRoutes: categoryRoutes.length,
      newsRoutes: newsRoutes.length,
      videoNewsRoutes: videoNewsRoutes.length,
      totalRoutes: routes.length + categoryRoutes.length + newsRoutes.length + videoNewsRoutes.length,
    })

    return [...routes, ...categoryRoutes, ...newsRoutes, ...videoNewsRoutes]
  } catch (error) {
    logDeploymentEvent('warn', 'sitemap', 'Dynamic sitemap generation failed; returning static routes', {
      staticRoutes: routes.length,
      error: toLoggableError(error),
    })

    return routes
  }
}
