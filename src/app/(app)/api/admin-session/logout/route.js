import config from '@payload-config'
import { NextResponse } from 'next/server'
import { generateExpiredPayloadCookie, getPayload } from 'payload'

export async function POST() {
  const payload = await getPayload({ config })
  const expiredCookie = generateExpiredPayloadCookie({
    collectionAuthConfig: payload.collections.users.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
  })

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': expiredCookie,
    },
  })
}
