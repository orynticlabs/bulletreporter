'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdBanner from '@/components/AdBanner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock, Eye, User, Calendar, ArrowLeft, Share2,
  Facebook, Twitter
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { getRelativeTime } from '@/utils/dateUtils'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticleBySlug, fetchPayloadArticles, normalizeRouteSlug } from '@/utils/payloadArticles'

const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.534 5.855L0 24l6.29-1.512A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.52-5.2-1.424l-.374-.22-3.733.897.933-3.64-.242-.374A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

export default function ArticleDetailClient({ initialArticle = null }) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { lang } = useLanguage()
  const slug = normalizeRouteSlug(params?.slug || initialArticle?.slug)

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => fetchPayloadArticleBySlug(slug),
    initialData: initialArticle || undefined,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: relatedData } = useQuery({
    queryKey: ['related', article?.category],
    queryFn: () => fetchPayloadArticles({ category: article.category, limit: 4 }),
    enabled: !!article?.category,
    staleTime: 5 * 60 * 1000,
  })

  const relatedArticles = (relatedData?.articles || []).filter(a => a.slug !== slug).slice(0, 3)

  const handleShare = useCallback((platform) => {
    const url = window.location.href
    const text = encodeURIComponent(article?.title || '')
    const urls = {
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }, [article])

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error || !article) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">📰</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            {lang === 'en' ? 'Article not found' : 'लेख नहीं मिला'}
          </h1>
          <p className="text-gray-500 mb-6">
            {lang === 'en'
              ? 'The article you are looking for does not exist or has been removed.'
              : 'आप जिस लेख को खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।'}
          </p>
          <Button onClick={() => router.push(getLangPath('/'))} className="bg-red-600 hover:bg-red-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {lang === 'en' ? 'Go Home' : 'होम पर जाएं'}
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'en' ? 'Go Back' : 'वापस जाएं'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Article */}
          <article className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              {article.image_url && (
                <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full overflow-hidden">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              )}

              <CardContent className="p-4 md:p-6 lg:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.category && (
                    <Badge
                      className="bg-red-600 text-white cursor-pointer hover:bg-red-700"
                      onClick={() => router.push(getLangPath(`/category/${encodeURIComponent(article.category)}`))}
                    >
                      {article.category}
                    </Badge>
                  )}
                  {article.is_breaking && (
                    <Badge variant="destructive">
                      {lang === 'en' ? 'Breaking' : 'ब्रेकिंग'}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {article.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap gap-3 text-xs md:text-sm text-gray-500 mb-6 pb-4 border-b">
                  {(article.editor_name || article.author_name) && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-red-500" />
                      {article.editor_name || article.author_name}
                    </span>
                  )}
                  {article.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-500" />
                      {getRelativeTime(article.created_at)}
                    </span>
                  )}
                  {(article.contentText || article.description) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      {getReadingTime(article.contentText || article.description)}
                    </span>
                  )}
                  {article.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-red-500" />
                      {article.views.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div
                  className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content || article.description || '' }}
                />

                {/* YouTube embed */}
                {article.youtube_url && (
                  <div className="mt-6 aspect-video rounded-xl overflow-hidden shadow">
                    <iframe
                      src={article.youtube_url.replace('watch?v=', 'embed/')}
                      className="w-full h-full"
                      allowFullScreen
                      title={article.title}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Share */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    {lang === 'en' ? 'Share this article' : 'इस लेख को साझा करें'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <WhatsAppIcon /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Facebook className="w-4 h-4" /> Facebook
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
                    >
                      <Twitter className="w-4 h-4" /> Twitter
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href)
                        toast({ title: lang === 'en' ? 'Link copied!' : 'लिंक कॉपी हो गया!' })
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                    >
                      🔗 {lang === 'en' ? 'Copy Link' : 'लिंक कॉपी'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <AdBanner size="medium" position="middle_banner" />
            </div>
          </article>

          {/* Sidebar — related articles */}
          {relatedArticles.length > 0 && (
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-base text-gray-800 mb-3 pb-2 border-b">
                      {lang === 'en' ? 'Related Articles' : 'संबंधित लेख'}
                    </h3>
                    <div className="space-y-3">
                      {relatedArticles.map(a => (
                        <div
                          key={a.id}
                          className="flex gap-2 cursor-pointer group"
                          onClick={() => router.push(getLangPath(`/article/${encodeURIComponent(a.slug)}`))}
                        >
                          {a.image_url && (
                            <img
                              src={a.image_url}
                              alt={a.title}
                              className="w-14 h-14 object-cover rounded flex-shrink-0"
                              loading="lazy"
                            />
                          )}
                          <p className="text-xs text-gray-700 group-hover:text-red-600 line-clamp-3 transition-colors">
                            {a.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <div className="mt-4">
                  <AdBanner size="small" position="sidebar" />
                </div>
              </div>
            </aside>
          )}
        </div>

        <div className="mt-8">
          <AdBanner size="large" position="bottom_banner" />
        </div>
      </main>
    </Layout>
  )
}
