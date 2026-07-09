'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { addCacheVersionToUrl, getPublicCacheVersion } from '@/utils/publicCacheState'
import { CONTENT_STALE_TIME } from '@/utils/queryConfig'

const PAYLOAD_API_BASE =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_SITE_URL
    : ''

const fetchAdvertisements = async () => {
  const version = await getPublicCacheVersion('advertisements')
  const url = addCacheVersionToUrl(`${PAYLOAD_API_BASE}/api/public/advertisements`, version)
  const response = await fetch(url, {
    cache: 'default',
    credentials: 'omit',
  })

  if (!response.ok) {
    throw new Error(`Advertisements request failed: ${response.status}`)
  }

  const data = await response.json()
  return data.advertisements || []
}

const slotConfig = {
  top_banner: {
    limit: 1,
    wrapper: 'container mx-auto px-3 py-3 sm:px-4',
    item: 'mx-auto block w-full max-w-[1300px] overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm',
    image: 'block w-full aspect-[65/8] object-cover',
  },
  bottom_banner: {
    limit: 1,
    wrapper: 'container mx-auto px-3 py-4 sm:px-4',
    item: 'mx-auto block w-full max-w-[1300px] overflow-hidden rounded-md border border-gray-100 bg-white shadow-sm',
    image: 'block w-full aspect-[65/8] object-cover',
  },
  sidebar: {
    limit: 3,
    wrapper: 'space-y-3',
    item: 'block w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm',
    image: 'block w-full aspect-[35/22] object-cover',
  },
}

function AdvertisementItem({ ad, config }) {
  const image = (
    <img
      src={ad.imageUrl}
      alt={ad.title || 'Advertisement'}
      className={config.image}
      loading="lazy"
    />
  )

  if (!ad.link) {
    return <div className={config.item}>{image}</div>
  }

  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={config.item}
      aria-label={ad.title || 'Advertisement'}
    >
      {image}
    </a>
  )
}

export default function AdvertisementSlot({ position }) {
  const config = slotConfig[position]

  const { data: advertisements = [] } = useQuery({
    queryKey: ['advertisements'],
    queryFn: fetchAdvertisements,
    staleTime: CONTENT_STALE_TIME,
    retry: 1,
  })

  const ads = useMemo(() => {
    if (!config) return []

    return advertisements
      .filter((ad) => ad.position === position && ad.imageUrl)
      .slice(0, config.limit)
  }, [advertisements, config, position])

  if (!config || ads.length === 0) return null

  return (
    <div className={config.wrapper}>
      {ads.map((ad) => (
        <AdvertisementItem key={ad.id} ad={ad} config={config} />
      ))}
    </div>
  )
}
