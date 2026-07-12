import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeFromNewsletter } from '@/lib/newsletter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const page = (title: string, message: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827"><main style="max-width:560px;margin:64px auto;background:#fff;padding:36px;border-radius:12px;text-align:center">
<h1 style="color:#b91c1c">${title}</h1><p style="line-height:1.6;color:#4b5563">${message}</p><a href="/" style="display:inline-block;margin-top:16px;background:#dc2626;color:#fff;padding:11px 20px;border-radius:7px;text-decoration:none">Return to Bullet Reporter</a>
</main></body></html>`

async function unsubscribe(req: NextRequest) {
  const removed = await unsubscribeFromNewsletter(req.nextUrl.searchParams.get('token') || '')
  return new NextResponse(
    page(
      removed ? 'Newsletter unsubscribed' : 'Subscription already removed',
      removed
        ? 'Your newsletter subscription has been removed. Your existing comments remain unchanged.'
        : 'This newsletter subscription is no longer active. Your existing comments remain unchanged.',
    ),
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

export const GET = unsubscribe
export const POST = unsubscribe
