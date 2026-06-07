const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    : ''

const CATEGORIES_TTL = 10 * 60 * 1000

let cachedCategories = null
let cachedAt = 0
let pendingCategories = null

export async function fetchPayloadCategories({ limit = 12 } = {}) {
  const now = Date.now()

  if (cachedCategories && now - cachedAt < CATEGORIES_TTL) {
    return cachedCategories.slice(0, limit)
  }

  if (pendingCategories) {
    return pendingCategories.then((categories) => categories.slice(0, limit))
  }

  pendingCategories = fetch(`${PAYLOAD_API_BASE}/api/public/categories?limit=${encodeURIComponent(limit)}`, {
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

// ── Site Settings ─────────────────────────────────────────────────────────────

const SETTINGS_TTL = 5 * 60 * 1000

let cachedSettings = null
let settingsCachedAt = 0
let pendingSettings = null

export async function fetchPayloadSettings() {
  const now = Date.now()

  if (cachedSettings && now - settingsCachedAt < SETTINGS_TTL) {
    return cachedSettings
  }

  if (pendingSettings) {
    return pendingSettings
  }

  pendingSettings = fetch(`${PAYLOAD_API_BASE}/api/globals/settings`, {
    credentials: 'omit',
    next: { revalidate: SETTINGS_TTL / 1000 },
  })
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json()
      cachedSettings = data
      settingsCachedAt = Date.now()
      return cachedSettings
    })
    .catch(() => null)
    .finally(() => {
      pendingSettings = null
    })

  return pendingSettings
}