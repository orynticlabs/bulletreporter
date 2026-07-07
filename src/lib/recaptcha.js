const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
const getDefaultMinScore = () => {
  const value = Number(process.env.RECAPTCHA_MIN_SCORE)
  return Number.isFinite(value) ? value : 0.5
}

const getClientIp = (request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  undefined

const isLocalhostRequest = (request) => {
  if (!request || process.env.NODE_ENV === 'production') return false

  try {
    const host = request.headers.get('host') || new URL(request.url).host
    const hostname = host.split(':')[0]?.replace(/^\[|\]$/g, '')

    return ['localhost', '127.0.0.1', '::1'].includes(hostname)
  } catch (_) {
    return false
  }
}

export function isRecaptchaConfigured() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY)
}

export async function verifyRecaptchaToken({
  action,
  minScore = getDefaultMinScore(),
  request,
  token,
}) {
  if (isLocalhostRequest(request)) {
    return { ok: true, reason: 'recaptcha-disabled-localhost' }
  }

  if (!process.env.RECAPTCHA_SECRET_KEY) {
    return {
      ok: process.env.NODE_ENV !== 'production',
      reason: process.env.NODE_ENV === 'production' ? 'recaptcha-not-configured' : 'recaptcha-disabled-dev',
    }
  }

  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'missing-recaptcha-token' }
  }

  const body = new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY,
    response: token,
  })

  const remoteIp = request ? getClientIp(request) : null
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      cache: 'no-store',
    })

    const data = await response.json()
    if (!data.success) {
      return { ok: false, reason: 'recaptcha-verification-failed', data }
    }

    if (action && data.action && data.action !== action) {
      return { ok: false, reason: 'recaptcha-action-mismatch', data }
    }

    if (typeof data.score === 'number' && data.score < minScore) {
      return { ok: false, reason: 'recaptcha-score-too-low', data }
    }

    return { ok: true, data }
  } catch (error) {
    return { ok: false, reason: 'recaptcha-network-error' }
  }
}

export async function verifyRecaptchaFromBody(request, body, action, options = {}) {
  const token =
    body?.recaptchaToken ||
    body?.captchaToken ||
    request.headers.get('x-recaptcha-token')

  const result = await verifyRecaptchaToken({
    action,
    minScore: options.minScore,
    request,
    token,
  })

  if (result.ok) return null

  return Response.json(
    {
      error: 'reCAPTCHA verification failed',
      reason: result.reason,
    },
    { status: 403 },
  )
}
