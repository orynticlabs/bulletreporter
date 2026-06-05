import JsonLd from '@/components/JsonLd'
import { buildMetadata, newsArticleJsonLd, SITE_DESCRIPTION, SITE_TITLE, truncate } from '@/lib/seo'
import { fetchArticleBySlug } from '@/lib/payload-direct'
import { normalizeRouteSlug } from '@/utils/payloadArticles'
import ArticleDetailClient from './ArticleDetailClient'

export async function generateMetadata({ params }) {
  const { slug: rawSlug } = await params
  const slug = normalizeRouteSlug(rawSlug)
  const article = await fetchArticleBySlug(slug)

  if (!article) {
    return buildMetadata({
      title: `Article Not Found - ${SITE_TITLE}`,
      description: SITE_DESCRIPTION,
      path: `/article/${slug}`,
      noIndex: true,
    })
  }

  return buildMetadata({
    title: article.title,
    description: truncate(article.description || article.contentText || SITE_DESCRIPTION),
    path: `/article/${article.slug}`,
    image: article.image_url || '/logo.png',
    type: 'article',
    publishedTime: article.created_at,
    modifiedTime: article.updated_at || article.created_at,
    authors: [article.editor_name || article.author_name || SITE_TITLE],
    keywords: [article.category, ...(article.tags || [])].filter(Boolean),
  })
}

export default async function ArticlePage({ params }) {
  const { slug: rawSlug } = await params
  const slug = normalizeRouteSlug(rawSlug)
  const article = await fetchArticleBySlug(slug)

  return (
    <>
      <JsonLd data={newsArticleJsonLd(article, `/article/${slug}`)} />
      <ArticleDetailClient initialArticle={article} />
    </>
  )
}
