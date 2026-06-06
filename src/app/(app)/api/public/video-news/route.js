import config from '@payload-config'
import { getPayload } from 'payload'
import { normalizeRouteSlug } from '@/utils/payloadArticles'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 2 * 60 * 1000
const cache = new Map()

const getCacheKey = (searchParams) => searchParams.toString()

const getNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function resolveCategoryId(payload, categoryParam) {
  if (!categoryParam) return null

  try {
    const result = await payload.find({
      collection: 'categories',
      limit: 1,
      depth: 0,
      draft: true,
      overrideAccess: true,
      where: {
        or: [
          { name: { equals: categoryParam } },
          { nameHindi: { equals: categoryParam } },
          { slug: { equals: categoryParam } },
        ],
      },
    })

    return result.docs[0]?.id ?? null
  } catch {
    return null
  }
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

  const slug = normalizeRouteSlug(searchParams.get('slug'))
  const categoryParam = searchParams.get('category')
  const search = searchParams.get('search')
  const lang = searchParams.get('lang')

  if (slug) where.slug = { equals: slug }
  if (lang && ['hi', 'en'].includes(lang)) where.language = { equals: lang }
  if (search) {
    where.or = [
      { title: { like: search } },
      { description: { like: search } },
      { 'tags.tag': { like: search } },
    ]
  }

  if (categoryParam) {
    const categoryId = await resolveCategoryId(payload, categoryParam)
    if (categoryId) {
      where.category = { equals: categoryId }
    } else {
      const empty = { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false }
      return Response.json(empty, { headers: { 'Cache-Control': 'public, max-age=30' } })
    }
  }

  let data

  try {
    data = await payload.find({
      collection: 'video-news',
      draft: true,
      overrideAccess: true,
      depth: getNumber(searchParams.get('depth'), 1),
      limit: getNumber(searchParams.get('limit'), 6),
      page: getNumber(searchParams.get('page'), 1),
      sort: searchParams.get('sort') || '-createdAt',
      where,
    })
  } catch (error) {
    if (error?.cause?.code === '42P01' || error?.code === '42P01') {
      const empty = { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false }
      return Response.json(empty, { headers: { 'Cache-Control': 'public, max-age=30' } })
    }

    throw error
  }

  data.docs = data.docs.map((doc) => ({
    ...doc,
    publishedAt: doc.publishedAt || doc.createdAt,
  }))

  cache.set(cacheKey, { data, timestamp: now })

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
  })
}
