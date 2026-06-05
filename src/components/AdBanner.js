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

const buildCloudinaryUrl = (image) => {
  if (!image?.cloudinaryPublicId) return null

  const cloudName = getCloudinaryCloudName(image)
  if (!cloudName) return null

  const publicId = String(image.cloudinaryPublicId)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${publicId}`
}

const getMediaUrl = (ad) => {
  const image = ad.image
  if (!image) return null
  if (typeof image === 'string') return image
  if (isCloudinaryUrl(image.url)) return image.url
  if (image.cloudinaryPublicId) {
    const cloudinaryUrl = buildCloudinaryUrl(image)
    if (cloudinaryUrl) return cloudinaryUrl
  }
  return image.sizes?.card?.url || image.url || null
}

const normalizeAd = (ad) => ({
  ...ad,
  imageUrl: getMediaUrl(ad),
  isActive: ad.isActive ?? true,
  linkUrl: ad.link || '#',
  placement: ad.position,
})

const Placeholder = ({ size, getSizeClasses }) => (
  <div className={`bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center ${getSizeClasses()}`}>
    <div className="text-center">
      <div className="text-primary font-bold text-lg mb-2">विज्ञापन स्थान</div>
      <div className="text-muted-foreground text-sm">
        {size === 'large' && 'बड़ा बैनर विज्ञापन'}
        {size === 'medium' && 'मध्यम बैनर विज्ञापन'}
        {size === 'small' && 'छोटा बैनर विज्ञापन'}
        {size === 'square' && 'वर्गाकार विज्ञापन'}
      </div>
    </div>
  </div>
)

const AdBanner = ({ size, position }) => {
  // Suppress SSR entirely — render consistent placeholder until client mounts
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { data: advertisements } = useQuery({
    queryKey: ['advertisements'],
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

  // Before mount: render placeholder — same on server and client, no mismatch
  if (!mounted) return <Placeholder size={size} getSizeClasses={getSizeClasses} />

  const currentAd = advertisements
    ?.map(normalizeAd)
    .find((ad) => ad.placement === position && ad.isActive)

  if (!currentAd) return <Placeholder size={size} getSizeClasses={getSizeClasses} />

  return (
    <a
      href={currentAd.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center overflow-hidden rounded-lg ${getSizeClasses()} ${currentAd.imageUrl ? '' : 'bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-dashed border-primary/30'}`}
    >
      {currentAd.imageUrl ? (
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-full object-contain bg-gray-50"
        />
      ) : (
        <div className="text-center text-muted-foreground p-4">
          <div className="text-primary font-bold text-lg">{currentAd.title}</div>
          <div>विज्ञापन</div>
        </div>
      )}
    </a>
  )
}

export default AdBanner
