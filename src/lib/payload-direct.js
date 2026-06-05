import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizePayloadArticle } from '@/utils/payloadArticles'

const getPayloadClient = cache(async () => getPayload({ config }))

// Cached per request-scope (React cache dedupes within the same render pass).
// generateMetadata + the page component both call this — only one DB query fires.
export const fetchArticleBySlug = cache(async (slug) => {
  if (!slug) return null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      draft: true,          // include draft-saved articles, relying on status field
      overrideAccess: true,
      depth: 2,
      limit: 1,
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
    })
    return normalizePayloadArticle(result.docs[0]) ?? null
  } catch (err) {
    console.error('[payload-direct] fetchArticleBySlug failed:', err?.message)
    return null
  }
})
