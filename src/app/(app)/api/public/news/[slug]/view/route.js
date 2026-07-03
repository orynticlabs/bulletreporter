import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const body = await request.json().catch(() => ({}))
    const captchaError = await verifyRecaptchaFromBody(request, body, 'news_view', { minScore: 0.3 })
    if (captchaError) return captchaError

    const payload = await getPayload({ config })

    // Find the article
    const result = await payload.find({
      collection: 'news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const article = result.docs[0]
    if (!article) {
      return Response.json({ error: 'Article not found' }, { status: 404 })
    }

    const newViews = (article.views || 0) + 1

    await payload.update({
      collection: 'news',
      id: article.id,
      data: { views: newViews },
      overrideAccess: true,
    })

    return Response.json({ views: newViews })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
