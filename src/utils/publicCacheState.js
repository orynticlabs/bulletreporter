import { PUBLIC_CACHE_CHECK_INTERVAL } from '@/utils/queryConfig'

const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : ''

export const PUBLIC_CACHE_VERSION_PARAM = '_cacheVersion'

const CACHE_STATE_TTL = PUBLIC_CACHE_CHECK_INTERVAL

let cachedCacheState = null
let cachedCacheStateAt = 0
let pendingCacheState = null

export async function fetchPublicCacheState({ forceRefresh = false } = {}) {
  const now = Date.now()

  if (!forceRefresh && cachedCacheState && now - cachedCacheStateAt < CACHE_STATE_TTL) {
    return cachedCacheState
  }

  if (pendingCacheState) return pendingCacheState

  pendingCacheState = fetch(`${PAYLOAD_API_BASE}/api/public/cache-state`, {
    cache: 'no-store',
    credentials: 'omit',
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Cache state request failed: ${response.status}`)
      }

      return response.json()
    })
    .then((data) => {
      cachedCacheState = data
      cachedCacheStateAt = Date.now()
      return data
    })
    .finally(() => {
      pendingCacheState = null
    })

  return pendingCacheState
}

export async function getPublicCacheVersion(scope = 'all', options = {}) {
  try {
    const state = await fetchPublicCacheState(options)
    return String(state?.versions?.[scope] || state?.version || '0')
  } catch {
    return '0'
  }
}

export function addCacheVersionToUrl(url, version) {
  if (!version || version === '0') return url

  const parsed = new URL(url, PAYLOAD_API_BASE || window.location.origin)
  parsed.searchParams.set(PUBLIC_CACHE_VERSION_PARAM, version)

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return parsed.toString()
  }

  return `${parsed.pathname}${parsed.search}`
}
