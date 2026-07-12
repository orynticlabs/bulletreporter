import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'
import { createAdminNotification } from '@/lib/adminNotifications'
import { after } from 'next/server'
import { subscribeToNewsletter } from '@/lib/newsletter'

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
    const { authorName, authorEmail, content, subscribeToNewsletter: wantsNewsletter } = body
    const captchaError = await verifyRecaptchaFromBody(request, body, 'video_comment')
    if (captchaError) return captchaError

    if (!authorName?.trim() || !authorEmail?.trim() || !content?.trim()) {
      return Response.json({ error: 'Name, email, and comment are required' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail.trim())) {
      return Response.json({ error: 'A valid email address is required' }, { status: 400 })
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
      overrideAccess: true,
      data: {
        videoArticle: video.id,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim().toLowerCase(),
        content: content.trim(),
        status: 'pending',
      },
    })

    after(async () => {
      const jobs = [createAdminNotification(payload, {
        type: 'comment', requiredPermission: 'comments.read', contentType: 'video-news',
        contentId: video.id, contentTitle: video.title, contentSlug: video.slug,
        message: `${authorName.trim()} commented on video news: ${video.title}`,
      })]
      if (wantsNewsletter) {
        jobs.push(subscribeToNewsletter({ name: authorName, email: authorEmail }))
      }
      await Promise.allSettled(jobs)
    })

    return Response.json(comment, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
