import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeRouteSlug } from '@/utils/payloadArticles'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 2 * 60 * 1000
const cache = new Map()

const getBoolean = (value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

const getCacheKey = (searchParams) => searchParams.toString()

const getNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const cacheKey = getCacheKey(searchParams)
  const cached = cache.get(cacheKey)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return Response.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    })
  }

  const payload = await getPayload({ config })
  const where = { status: { equals: 'published' } }
  const isBreaking = getBoolean(searchParams.get('isBreaking'))
  const isFeatured = getBoolean(searchParams.get('isFeatured'))
  const slug = normalizeRouteSlug(searchParams.get('slug'))
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  if (typeof isBreaking === 'boolean') where.isBreaking = { equals: isBreaking }
  if (typeof isFeatured === 'boolean') where.isFeatured = { equals: isFeatured }
  if (slug) where.slug = { equals: slug }
  if (category) where['category.name'] = { equals: category }
  if (search) where.title = { like: search }

  const data = await payload.find({
    collection: 'news',
    depth: getNumber(searchParams.get('depth'), 1),
    limit: getNumber(searchParams.get('limit'), 10),
    page: getNumber(searchParams.get('page'), 1),
    sort: searchParams.get('sort') || '-createdAt',
    where,
  })

  cache.set(cacheKey, { data, timestamp: now })

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
  })
}
