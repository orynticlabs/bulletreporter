'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import NewsCard from '@/components/NewsCard'
import AdBanner from '@/components/AdBanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Clock, Eye, User, Calendar, ArrowLeft, Share2,
  MessageCircle, ChevronRight, Facebook, Twitter, Send
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

export default function NewsDetail({ initialArticle = null }) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()
  const queryClient = useQueryClient()
  const slug = normalizeRouteSlug(params?.slug || initialArticle?.slug)

  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])

  // Fetch article
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: async () => {
      return fetchPayloadArticleBySlug(slug)
    },
    initialData: initialArticle || undefined,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Fetch related articles
  const { data: relatedData } = useQuery({
    queryKey: ['related', article?.category],
    queryFn: async () => {
      return fetchPayloadArticles({ category: article.category, limit: 4 })
    },
    enabled: !!article?.category,
    staleTime: 5 * 60 * 1000,
  })

  const relatedArticles = (relatedData?.articles || []).filter(a => a.slug !== slug).slice(0, 3)

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', article?.id],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('where[article][equals]', article.id)
      params.set('where[status][equals]', 'approved')
      params.set('sort', '-createdAt')
      params.set('limit', '50')
      const res = await fetch(`/api/comments?${params.toString()}`, { credentials: 'omit' })
      if (!res.ok) return []
      const data = await res.json()
      return data.docs || []
    },
    enabled: !!article?.id,
    staleTime: 2 * 60 * 1000,
  })

  // Submit comment
  const commentMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Comment submission failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', article?.id])
      setCommentName('')
      setCommentText('')
      toast({ title: lang === 'en' ? 'Comment added!' : 'टिप्पणी जोड़ी गई!' })
    },
    onError: () => toast({ title: lang === 'en' ? 'Error' : 'त्रुटि', variant: 'destructive' }),
  })

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

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentName.trim() || !commentText.trim()) {
      toast({ title: lang === 'en' ? 'Please fill all fields' : 'सभी फ़ील्ड भरें', variant: 'destructive' })
      return
    }
    commentMutation.mutate({
      article: article.id,
      authorName: commentName.trim(),
      content: commentText.trim(),
      status: 'pending',
    })
  }

  if (isLoading) return <Layout><div className="container mx-auto px-4 py-16"><LoadingSpinner size="lg" /></div></Layout>

  if (error || !article) return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">{t.newsDetail.articleNotFound}</h1>
        <p className="text-gray-500 mb-6">{t.newsDetail.articleNotFoundDesc}</p>
        <Button onClick={() => router.push(getLangPath('/'))} className="bg-red-600 hover:bg-red-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> {lang === 'en' ? 'Go Home' : 'होम पर जाएं'}
        </Button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 font-medium text-sm md:text-base transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.news.goBack}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Article */}
          <article className="lg:col-span-3">
            <Card className="overflow-hidden shadow-lg">
              {/* Hero Image */}
              {article.image_url && (
                <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 w-full overflow-hidden">
                  <img src={article.image_url} alt={article.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              )}

              <CardContent className="p-4 md:p-6 lg:p-8">
                {/* Category + Meta */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.category && (
                    <Badge className="bg-red-600 text-white cursor-pointer hover:bg-red-700"
                      onClick={() => router.push(getLangPath(`/category/${encodeURIComponent(article.category)}`))}>
                      {article.category}
                    </Badge>
                  )}
                  {article.is_breaking && (
                    <Badge variant="destructive">{lang === 'en' ? 'Breaking' : 'ब्रेकिंग'}</Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {article.title}
                </h1>

                {/* Meta info row */}
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-500 mb-6 pb-4 border-b">
                  {(article.editor_name || article.author_name) && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {article.editor_name || article.author_name}
                    </span>
                  )}
                  {article.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {getRelativeTime(article.created_at)}
                    </span>
                  )}
                  {(article.contentText || article.description) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {getReadingTime(article.contentText || article.description)}
                    </span>
                  )}
                  {article.views > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {article.views.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div
                  className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: article.content || article.description || '' }}
                />

                {/* YouTube Embed */}
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

                {/* Share buttons */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> {t.newsDetail.shareArticle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors">
                      <WhatsAppIcon /> WhatsApp
                    </button>
                    <button onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      <Facebook className="w-4 h-4" /> Facebook
                    </button>
                    <button onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors">
                      <Twitter className="w-4 h-4" /> Twitter
                    </button>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(window.location.href); toast({ title: lang === 'en' ? 'Link copied!' : 'लिंक कॉपी हो गया!' }) }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                      🔗 {lang === 'en' ? 'Copy Link' : 'लिंक कॉपी'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6"><AdBanner size="medium" position="middle_banner" /></div>

            {/* Comments */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <MessageCircle className="w-5 h-5 text-red-500" />
                  {t.comments.title} {comments.length > 0 && `(${comments.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Comment form */}
                <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3">
                  <Input placeholder={t.comments.namePlaceholder} value={commentName}
                    onChange={e => setCommentName(e.target.value)}
                    className="text-sm md:text-base" />
                  <Textarea placeholder={t.comments.commentPlaceholder} value={commentText}
                    onChange={e => setCommentText(e.target.value)} rows={3}
                    className="text-sm md:text-base resize-none" />
                  <Button type="submit" disabled={commentMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {commentMutation.isPending ? t.comments.submitting : t.comments.submit}
                  </Button>
                </form>

                {/* Comments list */}
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>{t.comments.noComments}</p>
                    <p className="text-sm">{t.comments.beFirst}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-red-600 font-bold text-sm">{c.authorName?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-semibold text-sm text-gray-800">{c.authorName}</span>
                            <span className="text-xs text-gray-400">{getRelativeTime(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 break-words">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </article>

          {/* Sidebar — hidden on mobile, sticky on desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {relatedArticles.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-red-500" />
                      {t.newsDetail.moreArticles}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3">
                    {relatedArticles.map(a => (
                      <div key={a.id} className="flex gap-2 cursor-pointer group"
                        onClick={() => router.push(getLangPath(`/news/${encodeURIComponent(a.slug)}`))}>
                        {a.image_url && (
                          <img src={a.image_url} alt={a.title}
                            className="w-14 h-14 object-cover rounded flex-shrink-0" loading="lazy" />
                        )}
                        <p className="text-xs text-gray-700 group-hover:text-red-600 line-clamp-3 transition-colors">
                          {a.title}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              <AdBanner size="small" position="sidebar" />
            </div>
          </aside>
        </div>

        {/* Related articles on mobile — show below article */}
        {relatedArticles.length > 0 && (
          <div className="lg:hidden mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-red-500" /> {t.newsDetail.moreArticles}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedArticles.map(a => (
                <NewsCard key={a.id} id={a.id} title={a.title}
                  excerpt={(a.description || '').slice(0, 80) + '...'}
                  category={a.category} author={a.editor_name || a.author_name}
                  publishedAt={a.created_at} readTime={getReadingTime(a.contentText || a.description)}
                  views={a.views || 0} imageUrl={a.image_url} slug={a.slug} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8"><AdBanner size="large" position="bottom_banner" /></div>
      </main>
    </Layout>
  )
}
