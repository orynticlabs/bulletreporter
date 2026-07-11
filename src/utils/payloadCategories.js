import { addCacheVersionToUrl, getPublicCacheVersion } from '@/utils/publicCacheState'

const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : ''

const CATEGORIES_TTL = 30 * 1000
export const ALL_CATEGORIES_LIMIT = 300

const CATEGORY_HI_FALLBACKS = {
  chattisgarh: 'छत्तीसगढ़',
  chattisgarh_news: 'छत्तीसगढ़',
  cricket: 'क्रिकेट',
  election: 'चुनाव',
  elections: 'चुनाव',
  uttar_pradesh: 'उत्तर प्रदेश',
  uttar_pradesh_news: 'उत्तर प्रदेश',
  up: 'उत्तर प्रदेश',
  about: 'हमारे बारे में',
  agriculture: 'कृषि',
  automobile: 'ऑटोमोबाइल',
  auto: 'ऑटोमोबाइल',
  bollywood: 'बॉलीवुड',
  breaking: 'ब्रेकिंग',
  business: 'व्यापार',
  career: 'करियर',
  careers: 'करियर',
  chhattisgarh: 'छत्तीसगढ़',
  cg: 'छत्तीसगढ़',
  city: 'शहर',
  crime: 'क्राइम',
  education: 'शिक्षा',
  entertainment: 'मनोरंजन',
  fashion: 'फैशन',
  game: 'खेल',
  games: 'खेल',
  health: 'स्वास्थ्य',
  india: 'भारत',
  international: 'अंतरराष्ट्रीय',
  job: 'नौकरी',
  jobs: 'नौकरी',
  latest: 'ताजा खबरें',
  lifestyle: 'लाइफस्टाइल',
  local: 'स्थानीय',
  madhya_pradesh: 'मध्य प्रदेश',
  madhya_pradesh_news: 'मध्य प्रदेश',
  mp: 'मध्य प्रदेश',
  national: 'राष्ट्रीय',
  other: 'अन्य',
  others: 'अन्य',
  politics: 'राजनीति',
  rewa: 'रीवा',
  religion: 'धर्म',
  science: 'विज्ञान',
  sports: 'खेल',
  state: 'राज्य',
  technology: 'तकनीक',
  tech: 'तकनीक',
  top_news: 'मुख्य समाचार',
  travel: 'यात्रा',
  trending: 'ट्रेंडिंग',
  video: 'वीडियो',
  video_news: 'वीडियो न्यूज़',
  viral: 'वायरल',
  weather: 'मौसम',
  world: 'विश्व',
}

const normalizeCategoryKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const hasDevanagari = (value = '') => /[\u0900-\u097F]/.test(String(value))

const getCategoryFallback = (value) => {
  const key = normalizeCategoryKey(value)
  if (!key) return ''
  if (CATEGORY_HI_FALLBACKS[key]) return CATEGORY_HI_FALLBACKS[key]

  const compactKey = key
    .replace(/_?(news|samachar|category|updates)$/g, '')
    .replace(/^(news|samachar|category|updates)_?/g, '')

  return CATEGORY_HI_FALLBACKS[compactKey] || ''
}

export const getCategoryDisplayName = (category = {}, lang = 'hi') => {
  if (lang === 'en') {
    return category.nameEn || category.name || category.nameHindi || category.title || ''
  }

  const directHindi = category.nameHindi || category.hindiName || category.titleHindi
  if (hasDevanagari(directHindi)) return directHindi

  const candidates = [
    category.slug,
    category.name,
    category.nameEn,
    category.title,
  ]

  for (const candidate of candidates) {
    const fallback = getCategoryFallback(candidate)
    if (fallback) return fallback
  }

  return category.name || category.nameEn || category.title || ''
}

export const getCategoryRouteKey = (category = {}) =>
  category.slug || category.name || category.nameEn || category.nameHindi || category.title || ''

let cachedCategories = null
let cachedCategoriesVersion = null
let cachedCategoriesLimit = 0
let cachedAt = 0
let pendingCategories = null
let pendingCategoriesLimit = 0

export async function fetchPayloadCategories({ limit = ALL_CATEGORIES_LIMIT } = {}) {
  const now = Date.now()
  const version = await getPublicCacheVersion('categories', { forceRefresh: true })

  if (
    cachedCategories &&
    cachedCategoriesVersion === version &&
    cachedCategoriesLimit >= limit &&
    now - cachedAt < CATEGORIES_TTL
  ) {
    return cachedCategories.slice(0, limit)
  }

  if (pendingCategories && pendingCategoriesLimit >= limit) {
    return pendingCategories.then((categories) => categories.slice(0, limit))
  }

  const url = addCacheVersionToUrl(
    `${PAYLOAD_API_BASE}/api/public/categories?limit=${encodeURIComponent(limit)}`,
    version,
  )

  pendingCategoriesLimit = limit
  const request = fetch(url, {
    cache: 'no-store',
    credentials: 'omit',
  })
    .then(async (res) => {
      if (!res.ok) return []

      const data = await res.json()
      cachedCategories = data.docs || []
      cachedCategoriesVersion = version
      cachedCategoriesLimit = limit
      cachedAt = Date.now()
      return cachedCategories
    })
    .catch(() => [])
    .finally(() => {
      if (pendingCategories === request) {
        pendingCategories = null
        pendingCategoriesLimit = 0
      }
    })

  pendingCategories = request
  return pendingCategories
}

// ── Site Settings ─────────────────────────────────────────────────────────────

const SETTINGS_TTL = 30 * 1000

let cachedSettings = null
let cachedSettingsVersion = null
let settingsCachedAt = 0
let pendingSettings = null

export async function fetchPayloadSettings() {
  const now = Date.now()
  const version = await getPublicCacheVersion('settings', { forceRefresh: true })

  if (cachedSettings && cachedSettingsVersion === version && now - settingsCachedAt < SETTINGS_TTL) {
    return cachedSettings
  }

  if (pendingSettings) {
    return pendingSettings
  }

  pendingSettings = fetch(
    addCacheVersionToUrl(`${PAYLOAD_API_BASE}/api/globals/settings`, version),
    {
      cache: 'no-store',
      credentials: 'omit',
    },
  )
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json()
      cachedSettings = data
      cachedSettingsVersion = version
      settingsCachedAt = Date.now()
      return cachedSettings
    })
    .catch(() => null)
    .finally(() => {
      pendingSettings = null
    })

  return pendingSettings
}
