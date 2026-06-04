import { DUMMY_ARTICLES } from '@/data/dummyArticles'
import { absoluteUrl, fetchNewsList, SITE_URL } from '@/lib/seo'

export default async function sitemap() {
  const staticRoutes = [
    '',
    '/news',
    '/news/breaking',
  ].map((path) => ({
    url: absoluteUrl(path || '/'),
    lastModified: new Date(),
    changeFrequency: path === '' ? 'hourly' : 'daily',
    priority: path === '' ? 1 : 0.85,
  }))

  const dummyRoutes = DUMMY_ARTICLES.map((article) => ({
    url: absoluteUrl(`/article/${article.slug}`),
    lastModified: new Date(article.created_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const liveNews = await fetchNewsList({ limit: 100, offset: 0 })
  const liveNewsRoutes = (liveNews.articles || []).map((article) => ({
    url: absoluteUrl(`/news/${article.slug}`),
    lastModified: new Date(article.updated_at || article.created_at || Date.now()),
    changeFrequency: 'daily',
    priority: article.is_breaking ? 0.95 : 0.8,
  }))

  const categories = [...new Set((liveNews.articles || []).map((article) => article.category).filter(Boolean))]
  const categoryRoutes = categories.map((category) => ({
    url: `${SITE_URL}/category/${encodeURIComponent(category)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.75,
  }))

  return [...staticRoutes, ...categoryRoutes, ...liveNewsRoutes, ...dummyRoutes]
}
