import JsonLd from '@/components/JsonLd'
import { buildMetadata, getDummyArticle, newsArticleJsonLd, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/seo'
import ArticleDetailClient from './ArticleDetailClient'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const article = getDummyArticle(slug)

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
    description: article.excerpt || article.content,
    path: `/article/${article.slug}`,
    image: article.image,
    type: 'article',
    publishedTime: article.created_at,
    modifiedTime: article.created_at,
    authors: [article.author || SITE_TITLE],
    keywords: [article.category, ...(article.tags || [])].filter(Boolean),
  })
}

export default async function ArticlePage({ params }) {
  const { slug } = await params
  const article = getDummyArticle(slug)

  return (
    <>
      <JsonLd data={newsArticleJsonLd(article, `/article/${slug}`)} />
      <ArticleDetailClient />
    </>
  )
}
