import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import type { SanitizedConfig } from 'payload'
import { verifyRecaptchaFromBody } from '@/lib/recaptcha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true

const configPromise = import('@payload-config').then(
  ({ default: config }) => config,
) as Promise<SanitizedConfig>

export const GET = REST_GET(configPromise)
const payloadPost = REST_POST(configPromise)

export async function POST(request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await context.params
  const path = slug.join('/')

  if (path === 'users/forgot-password' || path === 'users/reset-password') {
    const body = await request.clone().json().catch(() => ({}))
    const action = path === 'users/forgot-password' ? 'forgot_password' : 'reset_password'
    const captchaError = await verifyRecaptchaFromBody(request, body, action)
    if (captchaError) return captchaError
  }

  return payloadPost(request, context)
}
export const DELETE = REST_DELETE(configPromise)
export const PATCH = REST_PATCH(configPromise)
export const PUT = REST_PUT(configPromise)
export const OPTIONS = REST_OPTIONS(configPromise)
