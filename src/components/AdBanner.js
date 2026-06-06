'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

const PAYLOAD_API_BASE = typeof window === 'undefined'
  ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  : ''

const isCloudinaryUrl = (url = '') => /res\.cloudinary\.com|cloudinary\.com/.test(String(url))

const getCloudinaryCloudName = (image) => {
  const configuredName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (configuredName) return configuredName

  const cloudinaryUrl = [image?.url, image?.thumbnailURL]
    .filter(Boolean)
    .find(isCloudinaryUrl)

  if (!cloudinaryUrl) return null

  try {
    return new URL(cloudinaryUrl).pathname.split('/').filter(Boolean)[0] || null
  } catch {
    return null
  }
}

const SIZE_TRANSFORMS = {
  large: 'f_auto,q_auto,w_1280,h_320,c_fit',
  medium: 'f_auto,q_auto,w_1024,h_256,c_fit',
  small: 'f_auto,q_auto,w_640,h_180,c_fit',
  square: 'f_auto,q_auto,w_512,h_512,c_fit',
}

const LEGACY_POSITION_TO_TYPE = {
  top_banner: 'header_banner',
  middle_banner: 'middle_banner',
  bottom_banner: 'footer_banner',
  sidebar: 'sidebar_banner',
  bottom_sidebar: 'sidebar_banner',
}

const buildCloudinaryUrl = (image, size) => {
  if (!image?.cloudinaryPublicId) return null

  const cloudName = getCloudinaryCloudName(image)
  if (!cloudName) return null

  const transform = SIZE_TRANSFORMS[size] || 'f_auto,q_auto'
  const publicId = String(image.cloudinaryPublicId)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`
}

const getMediaUrl = (ad) => {
  const image = ad.image
  if (!image) return null
  if (typeof image === 'string') return image
  if (isCloudinaryUrl(image.url)) return image.url
  if (image.cloudinaryPublicId) {
    const cloudinaryUrl = buildCloudinaryUrl(image, ad.size)
    if (cloudinaryUrl) return cloudinaryUrl
  }
  return image.sizes?.card?.url || image.url || null
}

const normalizeAd = (ad) => ({
  ...ad,
  imageUrl: getMediaUrl(ad),
  isActive: ad.isActive ?? true,
  linkUrl: ad.link || '',
  placement: ad.position,
  bannerType: ad.bannerType || LEGACY_POSITION_TO_TYPE[ad.position],
  size: ad.size || 'large',
})

const AdBanner = ({ size, position }) => {
  // Suppress SSR entirely; banner data is client-fetched from Payload.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { data: advertisements } = useQuery({
    queryKey: ['advertisements', position, size],
    queryFn: async () => {
      const res = await fetch(`${PAYLOAD_API_BASE}/api/public/advertisements`, { credentials: 'omit' })
      if (!res.ok) return []
      const data = await res.json()
      return data.docs || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: mounted,
  })

  const getSizeClasses = () => {
    switch (size) {
      case 'large': return 'h-32 md:h-40'
      case 'medium': return 'h-24 md:h-32'
      case 'small': return 'h-16 md:h-20'
      case 'square': return 'h-64 w-full max-w-sm'
      default: return 'h-24'
    }
  }

  const getTargetTypes = () => {
    const targetType = LEGACY_POSITION_TO_TYPE[position]
    return [
      targetType,
      size === 'large' ? 'large_ad_banner' : null,
    ].filter(Boolean)
  }

  const matchesSlot = (ad) => {
    const targetTypes = getTargetTypes()
    const typeMatch = targetTypes.includes(ad.bannerType)
    const legacyMatch = position && ad.placement === position
    return ad.isActive && ad.imageUrl && ad.size === size && (typeMatch || legacyMatch)
  }

  // Before mount: render nothing to avoid hardcoded banner artwork or hydration mismatch.
  if (!mounted) return null

  const specificAd = advertisements
    ?.map(normalizeAd)
    .find(matchesSlot)

  const currentAd = specificAd || advertisements
    ?.map(normalizeAd)
    .find((ad) => ad.isActive && ad.imageUrl && ad.size === size && ad.bannerType === 'large_ad_banner')

  if (!currentAd) return null

  const content = (
    <img
      src={currentAd.imageUrl}
      alt={currentAd.title}
      className="w-full h-full object-contain bg-white"
    />
  )

  const className = `flex items-center justify-center overflow-hidden rounded-lg border border-red-100 bg-white shadow-sm ${getSizeClasses()}`

  if (!currentAd.linkUrl) {
    return <div className={className}>{content}</div>
  }

  return (
    <a
      href={currentAd.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  )
}

export default AdBanner
