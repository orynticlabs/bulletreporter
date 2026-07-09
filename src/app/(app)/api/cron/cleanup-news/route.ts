import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

/**
 * GET /api/cron/cleanup-news
 *
 * Deletes every news article whose `deleteAt` date has passed and every
 * advertisement whose `endsAt` date has passed.
 * The news `afterDelete` hook handles removing the featured image from
 * Cloudinary automatically.
 *
 * Security: requests must include the header
 *   Authorization: Bearer <CRON_SECRET>
 * or the query param  ?secret=<CRON_SECRET>
 *
 * Vercel Cron calls this endpoint every hour (see vercel.json).
 * You can also call it manually for testing.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const messageFromError = (err: unknown) => (
  err instanceof Error ? err.message : String(err)
)

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  // Validate secret
  if (cronSecret) {
    const authHeader = req.headers.get('authorization') ?? ''
    const querySecret = req.nextUrl.searchParams.get('secret') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : querySecret

    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date().toISOString()

  try {
    const payload = await getPayload({ config: configPromise })

    // Find all articles whose deleteAt is in the past
    const { docs: expiredArticles } = await payload.find({
      collection: 'news',
      where: {
        deleteAt: { less_than_equal: now },
      },
      limit: 100,
      depth: 1, // populate featuredImage so afterDelete hook can get the id
    })

    const { docs: expiredAdvertisements } = await payload.find({
      collection: 'advertisements',
      where: {
        endsAt: { less_than_equal: now },
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    if (expiredArticles.length === 0 && expiredAdvertisements.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No expired articles or advertisements found.' })
    }

    const results: { collection: string; id: string; title: string; status: 'deleted' | 'error'; error?: string }[] = []

    for (const article of expiredArticles) {
      try {
        await payload.delete({
          collection: 'news',
          id: article.id,
        })
        results.push({ collection: 'news', id: String(article.id), title: String(article.title), status: 'deleted' })
      } catch (err: unknown) {
        results.push({
          collection: 'news',
          id: String(article.id),
          title: String(article.title),
          status: 'error',
          error: messageFromError(err),
        })
      }
    }

    for (const advertisement of expiredAdvertisements) {
      try {
        await payload.delete({
          collection: 'advertisements',
          id: advertisement.id,
          overrideAccess: true,
        })
        results.push({ collection: 'advertisements', id: String(advertisement.id), title: String(advertisement.title), status: 'deleted' })
      } catch (err: unknown) {
        results.push({
          collection: 'advertisements',
          id: String(advertisement.id),
          title: String(advertisement.title),
          status: 'error',
          error: messageFromError(err),
        })
      }
    }

    const deleted = results.filter((r) => r.status === 'deleted').length
    const errors  = results.filter((r) => r.status === 'error').length

    return NextResponse.json({ deleted, errors, results })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: 'Internal server error', details: messageFromError(err) },
      { status: 500 },
    )
  }
}
