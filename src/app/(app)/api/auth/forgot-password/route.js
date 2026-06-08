import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const captchaError = await verifyRecaptchaFromBody(request, body, 'forgot_password')
    if (captchaError) return captchaError

    const email = String(body?.email || '').trim()
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    await payload.forgotPassword({
      collection: 'users',
      data: { email },
      overrideAccess: true,
      req: { headers: request.headers },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[auth forgot-password] Error:', error)
    return Response.json({ error: 'Unable to send reset email' }, { status: 500 })
  }
}
