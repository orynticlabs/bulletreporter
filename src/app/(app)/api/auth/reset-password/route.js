import config from '@payload-config'
import { generatePayloadCookie, getPayload } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'
import { logDeploymentEvent, toLoggableError } from '@/lib/deploymentLogger'
import { buildPasswordChangedEmail } from '@/lib/authEmailTemplates'

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
    const usersAuthConfig = payload.collections.users.config.auth
    const authCookie = generatePayloadCookie({
      collectionAuthConfig: usersAuthConfig,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })

    logDeploymentEvent('info', 'auth.reset-password', 'Password reset request processed', {
      userId: result?.user?.id,
    })

    if (result?.user?.email) {
      const requestUrl = new URL(request.url)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
      const message = buildPasswordChangedEmail({
        name: result.user.name,
        email: result.user.email,
        loginUrl: `${siteUrl.replace(/\/+$/, '')}/admin`,
      })

      await payload.sendEmail({
        html: message.html,
        subject: message.subject,
        text: message.text,
        to: result.user.email,
      })
    }

    return Response.json(
      { ok: true, user: result.user },
      { headers: { 'Set-Cookie': authCookie } },
    )
  } catch (error) {
    logDeploymentEvent('error', 'auth.reset-password', 'Password reset request failed', {
      error: toLoggableError(error),
    })

    return Response.json({ error: 'Unable to reset password' }, { status: 500 })
  }
}
