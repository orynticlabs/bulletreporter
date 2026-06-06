import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import type { SanitizedConfig } from 'payload'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const dynamicParams = true

const configPromise = import('@payload-config').then(
  ({ default: config }) => config,
) as Promise<SanitizedConfig>

export const GET = REST_GET(configPromise)
export const POST = REST_POST(configPromise)
export const DELETE = REST_DELETE(configPromise)
export const PATCH = REST_PATCH(configPromise)
export const PUT = REST_PUT(configPromise)
export const OPTIONS = REST_OPTIONS(configPromise)
