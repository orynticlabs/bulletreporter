import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'
import { logDeploymentEvent, toLoggableError } from '@/lib/deploymentLogger'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const captchaError = await verifyRecaptchaFromBody(request, body, 'forgot_password')
    if (captchaError) {
      logDeploymentEvent('warn', 'auth.forgot-password', 'Forgot password request blocked by reCAPTCHA')
      return captchaError
    }

    const email = String(body?.email || '').trim()
    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const result = await payload.forgotPassword({
      collection: 'users',
      data: { email },
      overrideAccess: true,
      req: { headers: request.headers },
    })

    logDeploymentEvent('info', 'auth.forgot-password', 'Forgot password request processed', {
      emailDomain: email.split('@').pop() || 'missing',
      resetTokenCreated: Boolean(result),
    })

    return Response.json({ ok: true })
  } catch (error) {
    logDeploymentEvent('error', 'auth.forgot-password', 'Forgot password request failed', {
      error: toLoggableError(error),
    })

    return Response.json({ error: 'Unable to send reset email' }, { status: 500 })
  }
}
