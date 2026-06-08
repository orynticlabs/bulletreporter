const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    : ''

export const PUBLIC_CACHE_VERSION_PARAM = '_cacheVersion'

export async function fetchPublicCacheState() {
  const response = await fetch(`${PAYLOAD_API_BASE}/api/public/cache-state`, {
    cache: 'no-store',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error(`Cache state request failed: ${response.status}`)
  }

  return response.json()
}

export async function getPublicCacheVersion(scope = 'all') {
  try {
    const state = await fetchPublicCacheState()
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
