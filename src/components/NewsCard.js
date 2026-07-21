'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Eye, User, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { shareOnPlatform } from '@/utils/socialSharing'
import { getRelativeTime } from '@/utils/dateUtils'
import { useLanguage } from '@/contexts/LanguageContext'

function NewsCard({ id, title, excerpt, category, categorySlug, categories = [], categorySlugs = [], author, publishedAt, readTime, views = 0, imageUrl, youtubeUrl, slug, featured = false, imageLoading = 'lazy' }) {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  const handleCardClick = useCallback(() => {
    if (slug) router.push(getLangPath(`/news/${encodeURIComponent(slug)}`))
  }, [slug, router, getLangPath])

  const handleShare = useCallback((e, platform) => {
    e.stopPropagation()
    shareOnPlatform(platform, { title, description: excerpt, image_url: imageUrl, slug })
    toast({ title: t.newsCard.sharing, description: `${platform} ${t.newsCard.opening}` })
  }, [title, excerpt, imageUrl, slug, toast, lang])

  return (
    <Card className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${featured ? 'md:col-span-2 border-red-200' : ''}`}
      onClick={handleCardClick}>
      <div className="relative w-full overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading={imageLoading}
          />
        ) : youtubeUrl ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-100">
            <div className="text-center text-gray-700">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 fill-white ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <p className="text-sm">{t.newsCard.watchVideo}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <span className="text-red-400 text-4xl font-bold opacity-30">BR</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className={`font-bold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2 mb-2 ${featured ? 'text-xl' : 'text-base'}`}>
          {title}
        </h3>

        {excerpt && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{excerpt}</p>}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
          {author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-red-500" />
              {author}
            </span>
          )}
          {publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-red-500" />
              {getRelativeTime(publishedAt)}
            </span>
          )}
          {readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-red-500" />
              {readTime} {t.newsCard.min}
            </span>
          )}
          {views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-red-500" />
              {views.toLocaleString()}
            </span>
          )}
        </div>

        {/* Share buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          {['WhatsApp', 'Facebook', 'Twitter'].map(platform => (
            <button key={platform}
              onClick={(e) => handleShare(e, platform.toLowerCase())}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              {platform}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default NewsCard
