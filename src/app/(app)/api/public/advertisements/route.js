import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const CACHE_TTL = 60 * 1000
let cachedResponse = null
let cachedAt = 0

const isCloudinaryUrl = (url = '') => /res\.cloudinary\.com|cloudinary\.com/.test(String(url))

const getCloudinaryCloudName = (media) => {
  const configuredName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME

  if (configuredName) return configuredName

  const cloudinaryUrl = [media?.url, media?.thumbnailURL]
    .filter(Boolean)
    .find(isCloudinaryUrl)

  if (!cloudinaryUrl) return null

  try {
    return new URL(cloudinaryUrl).pathname.split('/').filter(Boolean)[0] || null
  } catch {
    return null
  }
}

const buildCloudinaryUrl = (media, transform = 'f_auto,q_auto') => {
  if (!media?.cloudinaryPublicId) return null

  const cloudName = getCloudinaryCloudName(media)
  if (!cloudName) return null

  const publicId = String(media.cloudinaryPublicId).replace(/\s+/g, '%20')
  const transformPath = transform ? `${transform}/` : ''

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformPath}${publicId}`
}

const getImageUrl = (media, position) => {
  if (!media || typeof media !== 'object') return ''

  const transform = position === 'sidebar'
    ? 'f_auto,q_auto,c_limit,w_350,h_220'
    : 'f_auto,q_auto,c_limit,w_1300,h_160'

  return buildCloudinaryUrl(media, transform) || ''
}

const normalizeAd = (doc) => ({
  id: doc.id,
  title: doc.title || '',
  position: doc.position,
  bannerType: doc.bannerType,
  size: doc.size,
  link: doc.link || '',
  imageUrl: getImageUrl(doc.image, doc.position),
  startsAt: doc.startsAt,
  endsAt: doc.endsAt,
})

async function queryAdvertisements() {
  const payload = await getPayload({ config })
  const now = Date.now()

  const result = await payload.find({
    collection: 'advertisements',
    depth: 1,
    limit: 10,
    sort: 'createdAt',
    overrideAccess: true,
    where: { isActive: { equals: true } },
  })

  return (result.docs || [])
    .map(normalizeAd)
    .filter((ad) => {
      const startsAt = ad.startsAt ? new Date(ad.startsAt).getTime() : null
      const endsAt = ad.endsAt ? new Date(ad.endsAt).getTime() : null

      return (
        ad.position &&
        ad.imageUrl &&
        (!Number.isFinite(startsAt) || startsAt <= now) &&
        (!Number.isFinite(endsAt) || endsAt > now)
      )
    })
}

export async function GET() {
  const now = Date.now()

  if (cachedResponse && now - cachedAt < CACHE_TTL) {
    return Response.json(cachedResponse, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
    })
  }

  const advertisements = await queryAdvertisements()
  const data = { advertisements }

  cachedResponse = data
  cachedAt = now

  return Response.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=120' },
  })
}
