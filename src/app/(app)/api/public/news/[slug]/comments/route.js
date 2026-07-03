import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/public/news/[slug]/comments  — fetch approved comments for article
 * POST /api/public/news/[slug]/comments  — submit a new comment
 */

export async function GET(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200)

    const payload = await getPayload({ config })

    // Resolve article id from slug
    const newsResult = await payload.find({
      collection: 'news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const article = newsResult.docs[0]
    if (!article) {
      return Response.json({ docs: [], totalDocs: 0 })
    }

    const data = await payload.find({
      collection: 'comments',
      where: {
        article: { equals: article.id },
        status: { equals: 'approved' },
      },
      sort: '-createdAt',
      limit,
      depth: 0,
    })

    return Response.json(data)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const body = await request.json()
    const { authorName, authorEmail, content } = body
    const captchaError = await verifyRecaptchaFromBody(request, body, 'news_comment')
    if (captchaError) return captchaError

    if (!authorName?.trim() || !content?.trim()) {
      return Response.json({ error: 'Name and comment are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Resolve article id
    const newsResult = await payload.find({
      collection: 'news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const article = newsResult.docs[0]
    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 })
    }

    const comment = await payload.create({
      collection: 'comments',
      data: {
        article: article.id,
        authorName: authorName.trim(),
        authorEmail: authorEmail?.trim() || undefined,
        content: content.trim(),
        status: 'pending',
      },
    })

    return Response.json(comment, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
