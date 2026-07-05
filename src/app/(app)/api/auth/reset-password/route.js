import config from '@payload-config'
import { getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'
import { logDeploymentEvent, toLoggableError } from '@/lib/deploymentLogger'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const body = await request.json()
    const captchaError = await verifyRecaptchaFromBody(request, body, 'reset_password')
    if (captchaError) {
      logDeploymentEvent('warn', 'auth.reset-password', 'Password reset request blocked by reCAPTCHA')
      return captchaError
    }

    const token = String(body?.token || '').trim()
    const password = String(body?.password || '')

    if (!token || !password) {
      return Response.json({ error: 'Token and password are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const result = await payload.resetPassword({
      collection: 'users',
      data: { token, password },
      overrideAccess: true,
      req: { headers: request.headers },
    })

    logDeploymentEvent('info', 'auth.reset-password', 'Password reset request processed', {
      userId: result?.user?.id,
    })

    return Response.json({ ok: true, user: result.user })
  } catch (error) {
    logDeploymentEvent('error', 'auth.reset-password', 'Password reset request failed', {
      error: toLoggableError(error),
    })

    return Response.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
