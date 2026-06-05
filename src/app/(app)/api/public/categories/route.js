import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 10 * 60 * 1000
let cachedData = null
let cachedAt = 0

export async function GET() {
  const now = Date.now()

  if (cachedData && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedData, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    })
  }

  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 50,
    sort: 'order',
  })

  cachedData = data
  cachedAt = now

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  })
}
