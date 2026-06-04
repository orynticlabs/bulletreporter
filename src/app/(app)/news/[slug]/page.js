import JsonLd from '@/components/JsonLd'
import { buildMetadata, fetchNewsArticle, newsArticleJsonLd, SITE_DESCRIPTION, SITE_TITLE, truncate } from '@/lib/seo'
import NewsDetailClient from './NewsDetailClient'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const article = await fetchNewsArticle(slug)

  if (!article) {
    return buildMetadata({
      title: `News Not Found - ${SITE_TITLE}`,
      description: SITE_DESCRIPTION,
      path: `/news/${slug}`,
      noIndex: true,
    })
  }

  return buildMetadata({
    title: article.title || SITE_TITLE,
    description: article.meta_description || article.excerpt || truncate(article.description || article.content || SITE_DESCRIPTION),
    path: `/news/${slug}`,
    image: article.image_url || article.image || '/logo.png',
    type: 'article',
    publishedTime: article.created_at,
    modifiedTime: article.updated_at || article.created_at,
    authors: [article.author_name || SITE_TITLE],
    keywords: [article.category, ...(article.tags || [])].filter(Boolean),
  })
}

export default async function NewsDetailPage({ params }) {
  const { slug } = await params
  const article = await fetchNewsArticle(slug)

  return (
    <>
      <JsonLd data={newsArticleJsonLd(article, `/news/${slug}`)} />
      <NewsDetailClient />
    </>
  )
}
