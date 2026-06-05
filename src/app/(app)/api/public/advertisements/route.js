import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 5 * 60 * 1000
let cachedData = null
let cachedAt = 0

export async function GET() {
  const now = Date.now()

  if (cachedData && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedData, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
    })
  }

  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'advertisements',
    depth: 1,
    limit: 50,
    where: { isActive: { equals: true } },
  })

  cachedData = data
  cachedAt = now

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
  })
}
