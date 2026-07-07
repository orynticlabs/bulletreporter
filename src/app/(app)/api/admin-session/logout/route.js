import config from '@payload-config'
import { NextResponse } from 'next/server'
import { createLocalReq, generateExpiredPayloadCookie, getPayload, logoutOperation } from 'payload'

export async function POST(request) {
  const payload = await getPayload({ config })
  const authResult = await payload.auth({ headers: request.headers })

  if (authResult.user) {
    const collection = payload.collections[authResult.user.collection]

    if (collection) {
      const req = await createLocalReq({ user: authResult.user }, payload)
      await logoutOperation({ collection, req })
    }
  }

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
