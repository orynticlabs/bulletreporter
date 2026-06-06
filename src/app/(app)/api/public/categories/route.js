import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 10 * 60 * 1000
let cachedData = null
let cachedAt = 0

const getLimit = (searchParams) => {
  const parsed = Number(searchParams.get('limit'))
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 12) : 12
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const limit = getLimit(searchParams)
  const now = Date.now()

  if (cachedData && cachedData.limit === limit && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedData.data, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    })
  }

  const payload = await getPayload({ config })
  const data = await payload.find({
    collection: 'categories',
    depth: 0,
    limit,
    sort: 'order',
  })

  cachedData = { limit, data }
  cachedAt = now

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  })
}
