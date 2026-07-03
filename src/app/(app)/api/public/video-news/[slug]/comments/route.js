import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/public/video-news/[slug]/comments  — fetch approved comments
 * POST /api/public/video-news/[slug]/comments  — submit a new comment
 */

export async function GET(request, { params }) {
  try {
    const { slug: rawSlug } = await params
    const slug = decodeURIComponent(rawSlug)
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200)

    const payload = await getPayload({ config })

    const videoResult = await payload.find({
      collection: 'video-news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const video = videoResult.docs[0]
    if (!video) {
      return Response.json({ docs: [], totalDocs: 0 })
    }

    const data = await payload.find({
      collection: 'comments',
      where: {
        videoArticle: { equals: video.id },
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
    const captchaError = await verifyRecaptchaFromBody(request, body, 'video_comment')
    if (captchaError) return captchaError

    if (!authorName?.trim() || !content?.trim()) {
      return Response.json({ error: 'Name and comment are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const videoResult = await payload.find({
      collection: 'video-news',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const video = videoResult.docs[0]
    if (!video) {
      return Response.json({ error: 'Video not found' }, { status: 404 })
    }

    const comment = await payload.create({
      collection: 'comments',
      data: {
        videoArticle: video.id,
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
