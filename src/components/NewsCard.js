'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Eye, User, Calendar, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { shareOnPlatform } from '@/utils/socialSharing'
import { getRelativeTime } from '@/utils/dateUtils'
import { useLanguage } from '@/contexts/LanguageContext'

function NewsCard({ id, title, excerpt, category, categorySlug, author, publishedAt, readTime, views = 0, imageUrl, youtubeUrl, slug, featured = false }) {
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()

  // categorySlug is the URL-safe key (English name); falls back to display name
  const categoryKey = categorySlug || category

  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  const handleCardClick = useCallback(() => {
    if (slug) router.push(getLangPath(`/news/${encodeURIComponent(slug)}`))
  }, [slug, router, getLangPath])

  const handleCategoryClick = useCallback((e) => {
    e.stopPropagation()
    if (categoryKey) router.push(getLangPath(`/category/${encodeURIComponent(categoryKey)}`))
  }, [categoryKey, router, getLangPath])

  const handleShare = useCallback((e, platform) => {
    e.stopPropagation()
    shareOnPlatform(platform, { title, description: excerpt, image_url: imageUrl, slug })
    toast({ title: lang === 'en' ? 'Sharing...' : 'शेयर हो रहा है...', description: `${platform} ${lang === 'en' ? 'opening' : 'खुल रहा है'}` })
  }, [title, excerpt, imageUrl, slug, toast, lang])

  return (
    <Card className={`group overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${featured ? 'md:col-span-2 border-red-200' : ''}`}
      onClick={handleCardClick}>
      <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={title}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : youtubeUrl ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 fill-white ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <p className="text-sm">{lang === 'en' ? 'Watch Video' : 'वीडियो देखें'}</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <span className="text-red-400 text-4xl font-bold opacity-30">BR</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Category badge */}
        {category && (
          <Badge className="absolute top-3 left-3 bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors text-xs"
            onClick={handleCategoryClick}>
            {category}
          </Badge>
        )}

        {featured && (
          <Badge className="absolute top-3 right-3 bg-yellow-500 text-white text-xs flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {lang === 'en' ? 'Top Story' : 'मुख्य समाचार'}
          </Badge>
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
              {readTime} {lang === 'en' ? 'min' : 'मिनट'}
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
