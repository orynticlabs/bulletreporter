export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=900',
}

const getEnv = (key) => (process.env[key] || '').trim()

const getVideoId = (item) =>
  item?.snippet?.resourceId?.videoId ||
  item?.id?.videoId ||
  item?.id ||
  ''

const normalizeShort = (item) => {
  const videoId = getVideoId(item)
  const snippet = item?.snippet || {}

  if (!videoId) return null

  return {
    id: videoId,
    title: snippet.title || 'Bullet Reporter Short',
    description: snippet.description || '',
    publishedAt: snippet.publishedAt || null,
    thumbnail:
      snippet.thumbnails?.maxres?.url ||
      snippet.thumbnails?.standard?.url ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    url: `https://www.youtube.com/shorts/${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { next: { revalidate: 300 } })
  if (!response.ok) {
    throw new Error(`YouTube request failed: ${response.status}`)
  }
  return response.json()
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const apiKey = getEnv('YOUTUBE_API_KEY')
  const channelId = getEnv('YOUTUBE_CHANNEL_ID') || getEnv('NEXT_PUBLIC_YOUTUBE_CHANNEL_ID')
  const shortsPlaylistId = getEnv('YOUTUBE_SHORTS_PLAYLIST_ID')
  const configuredLimit = Number(getEnv('YOUTUBE_SHORTS_LIMIT')) || 24
  const maxResults = Math.min(Math.max(Number(searchParams.get('limit')) || configuredLimit, 1), 50)

  if (!apiKey || (!channelId && !shortsPlaylistId)) {
    return Response.json({ docs: [], configured: false }, { headers: CACHE_HEADERS })
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      part: 'snippet',
      maxResults: String(maxResults),
    })

    const url = shortsPlaylistId
      ? `https://www.googleapis.com/youtube/v3/playlistItems?${new URLSearchParams({
          ...Object.fromEntries(params),
          playlistId: shortsPlaylistId,
        })}`
      : `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
          ...Object.fromEntries(params),
          channelId,
          order: 'date',
          type: 'video',
          videoDuration: 'short',
        })}`

    const data = await fetchJson(url)
    const docs = (data.items || []).map(normalizeShort).filter(Boolean)

    return Response.json(
      {
        docs,
        configured: true,
        source: shortsPlaylistId ? 'playlist' : 'channel',
      },
      { headers: CACHE_HEADERS },
    )
  } catch (error) {
    return Response.json(
      { docs: [], configured: true, error: error?.message || 'Unable to fetch YouTube Shorts' },
      { status: 200, headers: CACHE_HEADERS },
    )
  }
}
