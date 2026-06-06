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

/**
 * Resolve a category name/slug string to a numeric ID.
 * The frontend routes by the category name shown on the card, which may be
 * the nameHindi value.  We search all three identifiers so the filter always
 * matches regardless of which display name ended up in the URL.
 */
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

  // Build the where clause using only our custom status field.
  // We query with draft:true so that articles saved (but not yet "Published"
  // via the Payload Publish button) are included — our custom status field is
  // the sole visibility gate.
  const where = { status: { equals: 'published' } }

  const isBreaking = getBoolean(searchParams.get('isBreaking'))
  const isFeatured = getBoolean(searchParams.get('isFeatured'))
  const slug = normalizeRouteSlug(searchParams.get('slug'))
  const categoryParam = searchParams.get('category')
  const search = searchParams.get('search')

  if (typeof isBreaking === 'boolean') where.isBreaking = { equals: isBreaking }
  if (typeof isFeatured === 'boolean') where.isFeatured = { equals: isFeatured }
  if (slug) where.slug = { equals: slug }
  if (search) {
    where.or = [
      { title: { like: search } },
      { titleEnglish: { like: search } },
      { excerpt: { like: search } },
      { 'tags.tag': { like: search } },
    ]
  }

  // Resolve category name → ID so the JOIN works reliably regardless of
  // whether nameHindi or name ended up in the URL.
  if (categoryParam) {
    const categoryId = await resolveCategoryId(payload, categoryParam)
    if (categoryId) {
      where.category = { equals: categoryId }
    } else {
      // No matching category — return empty result immediately
      const empty = { docs: [], totalDocs: 0, totalPages: 1, page: 1, hasNextPage: false, hasPrevPage: false }
      return Response.json(empty, { headers: { 'Cache-Control': 'public, max-age=30' } })
    }
  }

  const data = await payload.find({
    collection: 'news',
    draft: true,           // include articles saved but not yet Published via Payload button
    overrideAccess: true,  // access rule is enforced manually via the where clause above
    depth: getNumber(searchParams.get('depth'), 1),
    limit: getNumber(searchParams.get('limit'), 10),
    page: getNumber(searchParams.get('page'), 1),
    sort: searchParams.get('sort') || '-createdAt',
    where,
  })

  data.docs = data.docs.map((doc) => ({
    ...doc,
    publishedAt: doc.publishedAt || doc.createdAt,
  }))

  cache.set(cacheKey, { data, timestamp: now })

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
  })
}
