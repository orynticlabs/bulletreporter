import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

const CACHE_TTL = 5 * 1000
let cachedResponse = null
let cachedAt = 0
let pendingResponse = null

const timestampOf = (value) => {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

async function getLatestCollectionUpdate(payload, collection) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    sort: '-updatedAt',
    overrideAccess: true,
  })

  const updatedAt = timestampOf(result.docs?.[0]?.updatedAt)
  const totalDocs = Number(result.totalDocs || 0)

  return {
    updatedAt,
    totalDocs,
    version: `${updatedAt}:${totalDocs}`,
  }
}

async function getSettings(payload) {
  try {
    return await payload.findGlobal({
      slug: 'settings',
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

async function buildCacheState() {
    const payload = await getPayload({ config })
    const [
      news,
      videoNews,
      categories,
      advertisements,
      comments,
      settingsDoc,
    ] = await Promise.all([
      getLatestCollectionUpdate(payload, 'news'),
      getLatestCollectionUpdate(payload, 'video-news'),
      getLatestCollectionUpdate(payload, 'categories'),
      getLatestCollectionUpdate(payload, 'advertisements'),
      getLatestCollectionUpdate(payload, 'comments'),
      getSettings(payload),
    ])

    const settingsUpdatedAt = timestampOf(settingsDoc?.updatedAt)
    const settings = {
      updatedAt: settingsUpdatedAt,
      totalDocs: settingsDoc ? 1 : 0,
      version: String(settingsUpdatedAt),
    }

    const versionDetails = {
      news,
      videoNews,
      categories,
      advertisements,
      comments,
      settings,
    }

    const versions = {
      news: news.version,
      videoNews: videoNews.version,
      categories: categories.version,
      advertisements: advertisements.version,
      comments: comments.version,
      settings: settings.version,
    }

    versions.content = [versions.news, versions.videoNews, versions.comments].join('|')
    versions.navigation = [versions.categories, versions.settings].join('|')
    versions.monetization = versions.advertisements

    const version = [
      versions.content,
      versions.navigation,
      versions.monetization,
    ].join('|')

    return {
      version,
      versions,
      details: versionDetails,
    }
}

export async function GET() {
  const now = Date.now()

  if (cachedResponse && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedResponse, { headers: NO_STORE_HEADERS })
  }

  try {
    if (!pendingResponse) {
      pendingResponse = buildCacheState()
        .then((data) => {
          cachedResponse = data
          cachedAt = Date.now()
          return data
        })
        .finally(() => {
          pendingResponse = null
        })
    }

    const data = await pendingResponse
    return Response.json(data, { headers: NO_STORE_HEADERS })
  } catch (error) {
    return Response.json(
      {
        version: 0,
        versions: {},
        error: 'cache-state-unavailable',
      },
      {
        status: 503,
        headers: NO_STORE_HEADERS,
      },
    )
  }
}
