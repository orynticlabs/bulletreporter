import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const body = await request.json().catch(() => ({}))
    const captchaError = await verifyRecaptchaFromBody(request, body, 'video_view', { minScore: 0.3 })
    if (captchaError) return captchaError

    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'video-news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const video = result.docs[0]
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 })
    }

    const newViews = (video.views || 0) + 1

    await payload.update({
      collection: 'video-news',
      id: video.id,
      data: { views: newViews },
      overrideAccess: true,
    })

    return Response.json({ views: newViews })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
