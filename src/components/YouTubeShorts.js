'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Play, Youtube } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const fetchShorts = async () => {
  const response = await fetch('/api/public/youtube-shorts', { credentials: 'omit' })
  if (!response.ok) return []
  const data = await response.json()
  return data.docs || []
}

function ShortsCard({ short, active, onSelect, cardRef }) {
  const embedSrc = `${short.embedUrl}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1&loop=1&playlist=${encodeURIComponent(short.id)}`

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
      className={`group relative shrink-0 snap-center overflow-hidden rounded-[10px] border bg-black text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
        active
          ? 'h-[330px] w-[186px] border-red-500 shadow-2xl shadow-red-900/20 sm:h-[388px] sm:w-[218px] lg:h-[430px] lg:w-[242px]'
          : 'h-[276px] w-[156px] border-gray-200 opacity-80 shadow-md hover:opacity-100 sm:h-[324px] sm:w-[182px] lg:h-[360px] lg:w-[202px]'
      }`}
      aria-label={short.title}
    >
      <div className="relative h-full w-full bg-gray-950">
        {active ? (
          <iframe
            key={short.id}
            src={embedSrc}
            title={short.title}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={short.thumbnail}
              alt={short.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110">
              <Play className="h-5 w-5 fill-white" />
            </span>
          </>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <p className={`line-clamp-2 font-bold leading-snug text-white ${active ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
          {short.title}
        </p>
      </div>
    </div>
  )
}

export default function YouTubeShorts() {
  const { lang } = useLanguage()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollerRef = useRef(null)
  const cardRefs = useRef([])

  const { data: shorts = [], isLoading } = useQuery({
    queryKey: ['youtube-shorts'],
    queryFn: fetchShorts,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (activeIndex >= shorts.length) setActiveIndex(0)
  }, [activeIndex, shorts.length])

  useEffect(() => {
    const node = cardRefs.current[activeIndex]
    const scroller = scrollerRef.current
    if (!node || !scroller) return
    // Only scroll the horizontal carousel — never the page vertically.
    // scrollIntoView with block:'nearest' was causing the whole page to jump on load.
    const nodeLeft = node.offsetLeft
    const nodeWidth = node.offsetWidth
    const scrollerWidth = scroller.offsetWidth
    scroller.scrollTo({
      left: nodeLeft - (scrollerWidth / 2) + (nodeWidth / 2),
      behavior: 'smooth',
    })
  }, [activeIndex])

  if (!isLoading && shorts.length === 0) return null

  const move = (direction) => {
    if (!shorts.length) return
    setActiveIndex((current) => (current + direction + shorts.length) % shorts.length)
  }

  return (
    <section className="border-t border-red-100 bg-gradient-to-b from-white via-red-50/30 to-white py-8 md:py-10">
      <div className="container mx-auto px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-red-600 shadow-sm">
              <Youtube className="h-4 w-4 fill-red-600" />
              Shorts
            </div>
            <h2 className="mt-2 text-2xl font-black text-gray-950 md:text-3xl">
              {lang === 'en' ? 'Bullet Reporter YouTube Shorts' : 'बुलेट रिपोर्टर यूट्यूब शॉर्ट्स'}
            </h2>
          </div>
          {shorts.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(-1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                aria-label={lang === 'en' ? 'Previous Short' : 'पिछला शॉर्ट'}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                aria-label={lang === 'en' ? 'Next Short' : 'अगला शॉर्ट'}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-[360px] items-center gap-4 overflow-hidden sm:h-[420px] lg:h-[464px]">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-[276px] w-[156px] shrink-0 animate-pulse rounded-[10px] bg-gray-100 sm:h-[324px] sm:w-[182px] lg:h-[360px] lg:w-[202px]" />
            ))}
          </div>
        ) : (
          <div
            ref={scrollerRef}
            className="scrollbar-hide flex h-[360px] snap-x snap-mandatory items-center gap-4 overflow-x-auto scroll-smooth pb-3 pt-2 sm:h-[420px] lg:h-[464px]"
          >
            {shorts.map((short, index) => (
              <ShortsCard
                key={short.id}
                short={short}
                active={index === activeIndex}
                onSelect={() => setActiveIndex(index)}
                cardRef={(node) => {
                  cardRefs.current[index] = node
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}