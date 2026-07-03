import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizePayloadArticle, getOgImageUrl } from '@/utils/payloadArticles'

const getPayloadClient = cache(async () => getPayload({ config }))

/**
 * Fetches a published article by slug.
 * React cache() deduplicates within the same render pass so
 * generateMetadata + the page component share one DB query.
 *
 * Returns the normalised article with an extra `og_image_url` field that
 * contains a Cloudinary URL pre-sized for Open Graph (1200×630, JPEG).
 */
export const fetchArticleBySlug = cache(async (slug) => {
  if (!slug) return null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      draft: true,           // include draft-saved articles; status field gates visibility
      overrideAccess: true,
      depth: 2,              // populate featuredImage + category + author
      limit: 1,
      where: {
        slug:   { equals: slug },
        status: { equals: 'published' },
      },
    })

    const raw = result.docs[0]
    if (!raw) return null

    const article = normalizePayloadArticle(raw)

    // Attach an OG-optimised image URL (1200×630 JPEG) derived directly from
    // the raw Cloudinary publicId — bypasses any stored URL that may lack dims.
    const rawFeaturedImage =
      raw.featuredImage && typeof raw.featuredImage === 'object'
        ? raw.featuredImage
        : null

    article.og_image_url = getOgImageUrl(rawFeaturedImage) || article.image_url || null

    return article
  } catch {
    return null
  }
})
