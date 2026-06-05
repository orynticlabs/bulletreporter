const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    : ''

const CATEGORIES_TTL = 10 * 60 * 1000

let cachedCategories = null
let cachedAt = 0
let pendingCategories = null

export async function fetchPayloadCategories() {
  const now = Date.now()

  if (cachedCategories && now - cachedAt < CATEGORIES_TTL) {
    return cachedCategories
  }

  if (pendingCategories) {
    return pendingCategories
  }

  pendingCategories = fetch(`${PAYLOAD_API_BASE}/api/public/categories`, {
    cache: 'force-cache',
    credentials: 'omit',
    next: { revalidate: CATEGORIES_TTL / 1000 },
  })
    .then(async (res) => {
      if (!res.ok) return []

      const data = await res.json()
      cachedCategories = data.docs || []
      cachedAt = Date.now()
      return cachedCategories
    })
    .catch(() => [])
    .finally(() => {
      pendingCategories = null
    })

  return pendingCategories
}
