import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 5 * 60 * 1000
const TRANSIENT_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE'])
let cachedData = null
let cachedAt = 0

async function queryAdvertisements() {
  const payload = await getPayload({ config })
  return payload.find({
    collection: 'advertisements',
    depth: 1,
    limit: 50,
    where: { isActive: { equals: true } },
  })
}

export async function GET() {
  const now = Date.now()

  if (cachedData && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedData, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
    })
  }

  try {
    const data = await queryAdvertisements()
    cachedData = data
    cachedAt = now
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
    })
  } catch (err) {
    const isTransient = TRANSIENT_CODES.has(err?.code) || TRANSIENT_CODES.has(err?.cause?.code)

    if (isTransient) {
      // One retry after a short pause
      await new Promise((r) => setTimeout(r, 500))
      try {
        const data = await queryAdvertisements()
        cachedData = data
        cachedAt = now
        return Response.json(data, {
          headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' },
        })
      } catch {
        // Fall through to stale-cache / empty response below
      }
    }

    // Serve stale cache if available, otherwise return empty docs
    const fallback = cachedData ?? { docs: [], totalDocs: 0 }
    return Response.json(fallback, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=30' },
    })
  }
}
