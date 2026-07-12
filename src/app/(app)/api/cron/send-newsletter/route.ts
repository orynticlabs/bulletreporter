import { NextRequest, NextResponse } from 'next/server'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import {
  claimNewsletterDelivery,
  completeNewsletterDelivery,
  failNewsletterDelivery,
  getDigestItemsForSubscriber,
  getNewsletterCandidates,
} from '@/lib/newsletter'
import { buildNewsletterEmail } from '@/lib/newsletterEmail'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const concurrency = Math.max(1, Math.min(Number(process.env.NEWSLETTER_SEND_CONCURRENCY || 5), 10))
const batchSize = Math.max(1, Math.min(Number(process.env.NEWSLETTER_BATCH_SIZE || 500), 2000))

const getIndiaSlotKey = (date = new Date()) => {
  const indiaDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
  const day = indiaDate.toISOString().slice(0, 10)
  const minutes = indiaDate.getUTCHours() * 60 + indiaDate.getUTCMinutes()
  return `${day}:${minutes < 13 * 60 + 45 ? 'morning' : 'evening'}`
}

const isAuthorized = (req: NextRequest) => {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  const auth = req.headers.get('authorization') || ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const subscribers = await getNewsletterCandidates(batchSize)
  const slotKey = getIndiaSlotKey()
  const results = { candidates: subscribers.length, sent: 0, failed: 0, skipped: 0 }

  let cursor = 0
  const worker = async () => {
    while (cursor < subscribers.length) {
      const subscriber = subscribers[cursor++]
      const items = await getDigestItemsForSubscriber(subscriber)
      if (!items.length) {
        results.skipped++
        continue
      }

      const deliveryId = await claimNewsletterDelivery({ subscriberId: subscriber.id, slotKey })
      if (!deliveryId) {
        results.skipped++
        continue
      }

      try {
        const message = buildNewsletterEmail({ subscriber, items })
        await payload.sendEmail({
          from: `"Bullet Reporter" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
          to: subscriber.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: {
            'List-Unsubscribe': `<${(message.text.match(/Unsubscribe: (.+)$/m) || [])[1] || ''}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        const deliveredThrough = items.reduce(
          (latest, item) => new Date(item.published_at) > latest ? new Date(item.published_at) : latest,
          new Date(items[0].published_at),
        )
        await completeNewsletterDelivery({ deliveryId, subscriberId: subscriber.id, deliveredThrough })
        results.sent++
      } catch (error) {
        await failNewsletterDelivery(deliveryId, error)
        results.failed++
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, subscribers.length) }, worker))
  return NextResponse.json({ slotKey, ...results })
}
