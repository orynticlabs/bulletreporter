import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

/**
 * POST /api/public/news/[slug]/react
 * Body: { type: 'like' | 'dislike', action: 'add' | 'remove' }
 * Returns: { likes: number, dislikes: number }
 */
export async function POST(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const body = await request.json()
    const { type, action } = body
    const captchaError = await verifyRecaptchaFromBody(request, body, 'news_reaction', { minScore: 0.3 })
    if (captchaError) return captchaError

    if (!['like', 'dislike'].includes(type) || !['add', 'remove'].includes(action)) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const payload = await getPayload({ config })

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

    const delta = action === 'add' ? 1 : -1
    const data = {}

    if (type === 'like') {
      data.likes = Math.max(0, (article.likes || 0) + delta)
    } else {
      data.dislikes = Math.max(0, (article.dislikes || 0) + delta)
    }

    const updated = await payload.update({
      collection: 'news',
      id: article.id,
      data,
      overrideAccess: true,
      depth: 0,
    })

    return Response.json({
      likes: updated.likes ?? 0,
      dislikes: updated.dislikes ?? 0,
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
