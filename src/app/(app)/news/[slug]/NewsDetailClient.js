'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  MessageCircle, ChevronRight, ChevronDown, ChevronUp,
  Facebook, Twitter, Send, ThumbsUp, ThumbsDown, Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { getRelativeTime } from '@/utils/dateUtils'
import { getReadingTime } from '@/utils/timeUtils'
import { fetchPayloadArticleBySlug, fetchPayloadArticles, normalizeRouteSlug } from '@/utils/payloadArticles'

const STORAGE_KEY = 'br_reactions' // localStorage key for like/dislike state

// ── WhatsApp SVG ────────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.534 5.855L0 24l6.29-1.512A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.52-5.2-1.424l-.374-.22-3.733.897.933-3.64-.242-.374A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
)

// ── helpers for localStorage reaction store ──────────────────────────────────
function getStoredReactions() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function setStoredReaction(slug, type /* 'like'|'dislike'|null */) {
  const store = getStoredReactions()
  if (type === null) delete store[slug]
  else store[slug] = type
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// ── Single comment card ──────────────────────────────────────────────────────
function CommentCard({ c }) {
  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-red-600 font-bold text-sm">{c.authorName?.[0]?.toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-gray-800">{c.authorName}</span>
          <span className="text-xs text-gray-400">{getRelativeTime(c.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 break-words leading-relaxed">{c.content}</p>
      </div>
    </div>
  )
}

// ── Suggested article mini-card ──────────────────────────────────────────────
function SuggestedCard({ article, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 cursor-pointer group hover:bg-red-50 rounded-xl p-2 border border-transparent hover:border-red-100 transition-all"
    >
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
        {article.image_url ? (
          <img src={article.image_url} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <span className="text-red-400 font-bold text-xs opacity-60">BR</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        {article.category && (
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">{article.category}</span>
        )}
        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-3 leading-snug mt-0.5">
          {article.title}
        </p>
        {article.created_at && (
          <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{getRelativeTime(article.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function NewsDetail({ initialArticle = null }) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()
  const queryClient = useQueryClient()
  const slug = normalizeRouteSlug(params?.slug || initialArticle?.slug)

  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const COMMENTS_PREVIEW = 3

  // Reaction state (optimistic)
  const [reaction, setReaction] = useState(null) // 'like' | 'dislike' | null
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 })
  const [liveViews, setLiveViews] = useState(null)
  const viewFired = useRef(false)

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const goTo = useCallback((s) => router.push(getLangPath(`/news/${encodeURIComponent(s)}`)), [router, getLangPath])

  // ── Fetch article ────────────────────────────────────────────────────────
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug, lang],
    queryFn: () => fetchPayloadArticleBySlug(slug, { lang }),
    initialData: lang === 'hi' ? (initialArticle || undefined) : undefined,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Sync counts when article loads
  useEffect(() => {
    if (!article) return
    setReactionCounts({ likes: article.likes || 0, dislikes: article.dislikes || 0 })
    setLiveViews(article.views || 0)
    // Restore persisted reaction
    const stored = getStoredReactions()
    setReaction(stored[article.slug] ?? null)
  }, [article?.id])

  // ── Fire view once per session ───────────────────────────────────────────
  useEffect(() => {
    if (!article?.slug || viewFired.current) return
    const sessionKey = `br_viewed_${article.slug}`
    if (sessionStorage.getItem(sessionKey)) return
    viewFired.current = true
    sessionStorage.setItem(sessionKey, '1')

    fetch(`/api/public/news/${encodeURIComponent(article.slug)}/view`, { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.views != null) setLiveViews(data.views) })
      .catch(() => {})
  }, [article?.slug])

  // ── Fetch suggested articles (same category, exclude self) ───────────────
  const { data: suggestedData } = useQuery({
    queryKey: ['suggested', article?.category_slug, lang],
    queryFn: () => fetchPayloadArticles({ category: article.category_slug || article.category, limit: 7, lang }),
    enabled: !!(article?.category_slug || article?.category),
    staleTime: 5 * 60 * 1000,
  })
  const suggestedArticles = (suggestedData?.articles || []).filter(a => a.slug !== slug).slice(0, 6)

  // ── Fetch comments ───────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/news/${encodeURIComponent(slug)}/comments`)
      if (!res.ok) return []
      const data = await res.json()
      return data.docs || []
    },
    enabled: !!slug,
    staleTime: 60 * 1000,
  })
  const comments = commentsData || []
  const visibleComments = showAllComments ? comments : comments.slice(0, COMMENTS_PREVIEW)

  // ── Submit comment ───────────────────────────────────────────────────────
  const commentMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/public/news/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', slug])
      setCommentName('')
      setCommentEmail('')
      setCommentText('')
      toast({ title: t.comments.submitted, description: t.comments.pending })
    },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  })

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentName.trim() || !commentText.trim()) {
      toast({ title: t.common.fillRequired, variant: 'destructive' })
      return
    }
    commentMutation.mutate({ authorName: commentName.trim(), authorEmail: commentEmail.trim() || undefined, content: commentText.trim() })
  }

  // ── React (like / dislike) ───────────────────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: async ({ type, action }) => {
      const res = await fetch(`/api/public/news/${encodeURIComponent(slug)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (data) => {
      setReactionCounts({ likes: data.likes, dislikes: data.dislikes })
    },
    onError: (_err, variables) => {
      // Revert optimistic update
      const stored = getStoredReactions()
      setReaction(stored[slug] ?? null)
      setReactionCounts({ likes: article?.likes || 0, dislikes: article?.dislikes || 0 })
    },
  })

  const handleReact = (type) => {
    if (reactMutation.isPending) return
    const isActive = reaction === type
    const newReaction = isActive ? null : type

    // Optimistic update
    setReaction(newReaction)
    setStoredReaction(slug, newReaction)

    const updates = { ...reactionCounts }
    // Remove old reaction if switching
    if (reaction === 'like' && type === 'dislike') updates.likes = Math.max(0, updates.likes - 1)
    if (reaction === 'dislike' && type === 'like') updates.dislikes = Math.max(0, updates.dislikes - 1)
    // Apply new
    if (isActive) {
      if (type === 'like') updates.likes = Math.max(0, updates.likes - 1)
      else updates.dislikes = Math.max(0, updates.dislikes - 1)
    } else {
      if (type === 'like') updates.likes += 1
      else updates.dislikes += 1
    }
    setReactionCounts(updates)

    // If switching from opposite reaction, remove it first then add new
    const promises = []
    if (reaction && reaction !== type) {
      promises.push(
        fetch(`/api/public/news/${encodeURIComponent(slug)}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: reaction, action: 'remove' }),
        })
      )
    }
    reactMutation.mutate({ type, action: isActive ? 'remove' : 'add' })
  }

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback((platform) => {
    // Build the canonical article URL from the REAL page origin (window.location.origin
    // is always correct regardless of how NEXT_PUBLIC_SITE_URL is set at build time).
    // Strip /en/ prefix so crawlers always hit the same canonical path that
    // generateMetadata uses — this is what has the og:image / og:title tags.
    const origin        = window.location.origin                       // e.g. https://bulletreporter.in
    const canonicalUrl  = `${origin}/news/${slug}`                     // /news/abc123 (no /en/)

    const shareTitle    = article?.title || ''
    const encodedUrl    = encodeURIComponent(canonicalUrl)
    const encodedTitle  = encodeURIComponent(shareTitle)

    const urls = {
      // WhatsApp scrapes og:title + og:image from canonicalUrl automatically
      whatsapp: `https://wa.me/?text=${encodedUrl}`,
      // Facebook reads og:* from the URL
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      // Twitter shows title as tweet text + card image from og:image
      twitter:  `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }, [article, slug])

  // ── Render states ────────────────────────────────────────────────────────
  if (isLoading) return <Layout><div className="container mx-auto px-4 py-16"><LoadingSpinner size="lg" /></div></Layout>

  if (error || !article) return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">{t.newsDetail.articleNotFound}</h1>
        <p className="text-gray-500 mb-6">{t.newsDetail.articleNotFoundDesc}</p>
        <Button onClick={() => router.push(getLangPath('/'))} className="bg-red-600 hover:bg-red-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.newsDetail.goHome}
        </Button>
      </div>
    </Layout>
  )

  const isLiked = reaction === 'like'
  const isDisliked = reaction === 'dislike'

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <AdBanner size="large" position="top_banner" />
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.news.goBack}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

          {/* ── Main Article ── */}
          <article className="lg:col-span-3 space-y-6">
            <Card className="overflow-hidden shadow-lg">

              {/* Hero image */}
              {article.image_url && (
                <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '720px' }}>
                  <img src={article.image_url} alt={article.title}
                    className="w-full h-full object-contain bg-black" loading="eager" />
                </div>
              )}

              <CardContent className="p-4 md:p-6 lg:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {article.category && (
                    <Badge className="bg-red-600 text-white cursor-pointer hover:bg-red-700"
                      onClick={() => router.push(getLangPath(`/category/${encodeURIComponent(article.category)}`))}>
                      {article.category}
                    </Badge>
                  )}
                  {article.is_breaking && (
                    <Badge variant="destructive">{t.newsDetail.breaking}</Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {article.title}
                </h1>

                {/* Meta row */}
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
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    {(liveViews ?? 0).toLocaleString()} {t.newsDetail.views}
                  </span>
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
                      className="w-full h-full" allowFullScreen
                      title={article.title} loading="lazy" />
                  </div>
                )}

                {/* ── Like / Dislike bar ── */}
                <div className="mt-6 pt-5 border-t">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
                    {t.newsDetail.helpfulQuestion}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Like */}
                    <button
                      onClick={() => handleReact('like')}
                      disabled={reactMutation.isPending}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border-2 ${
                        isLiked
                          ? 'bg-green-500 text-white border-green-500 shadow-md scale-105'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 transition-transform ${isLiked ? 'scale-110' : ''}`} />
                      <span>{reactionCounts.likes}</span>
                      <span className="hidden sm:inline">{t.reactions.likes}</span>
                    </button>

                    {/* Dislike */}
                    <button
                      onClick={() => handleReact('dislike')}
                      disabled={reactMutation.isPending}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all border-2 ${
                        isDisliked
                          ? 'bg-red-500 text-white border-red-500 shadow-md scale-105'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600'
                      }`}
                    >
                      <ThumbsDown className={`w-4 h-4 transition-transform ${isDisliked ? 'scale-110' : ''}`} />
                      <span>{reactionCounts.dislikes}</span>
                      <span className="hidden sm:inline">{t.reactions.dislikes}</span>
                    </button>

                    {/* Active label */}
                    {reaction && (
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        isLiked ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {isLiked ? t.reactions.youLiked : t.reactions.youDisliked}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Share ── */}
                <div className="mt-5 pt-4 border-t">
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
                      onClick={() => {
                        const link = `${window.location.origin}/news/${slug}`
                        navigator.clipboard?.writeText(link)
                        toast({ title: t.newsDetail.linkCopied })
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors">
                      🔗 {t.newsDetail.copyLink}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <AdBanner size="medium" position="middle_banner" />

            {/* ── Suggested Articles (below article, above comments) ── */}
            {suggestedArticles.length > 0 && (
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Zap className="w-5 h-5 text-red-500 fill-red-100" />
                    {t.suggested.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {suggestedArticles.map(a => (
                      <SuggestedCard key={a.id} article={a} onClick={() => goTo(a.slug)} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Comments ── */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MessageCircle className="w-5 h-5 text-red-500" />
                  {t.comments.title}
                  {comments.length > 0 && (
                    <span className="ml-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                {/* Comment form */}
                <form onSubmit={handleCommentSubmit} className="mb-6 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    {t.newsDetail.leaveComment}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder={`${t.comments.namePlaceholder} *`}
                      value={commentName}
                      onChange={e => setCommentName(e.target.value)}
                      className="text-sm bg-white"
                      required
                    />
                    <Input
                      placeholder={t.newsDetail.emailOptional}
                      type="email"
                      value={commentEmail}
                      onChange={e => setCommentEmail(e.target.value)}
                      className="text-sm bg-white"
                    />
                  </div>
                  <Textarea
                    placeholder={t.comments.commentPlaceholder}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                    className="text-sm resize-none bg-white"
                    required
                  />
                  <Button type="submit" disabled={commentMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 w-full sm:w-auto flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {commentMutation.isPending ? t.comments.submitting : t.comments.submit}
                  </Button>
                </form>

                {/* Comments list */}
                {commentsLoading ? (
                  <div className="text-center py-6 text-gray-400 text-sm">{t.comments.loadingComments}</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">{t.comments.noComments}</p>
                    <p className="text-sm">{t.comments.beFirst}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleComments.map(c => <CommentCard key={c.id} c={c} />)}

                    {/* Show All / Show Less toggle */}
                    {comments.length > COMMENTS_PREVIEW && (
                      <button
                        onClick={() => setShowAllComments(v => !v)}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 font-semibold py-2.5 border border-red-200 hover:border-red-400 rounded-xl transition-colors"
                      >
                        {showAllComments ? (
                          <><ChevronUp className="w-4 h-4" />{t.comments.showLess}</>
                        ) : (
                          <><ChevronDown className="w-4 h-4" />{t.comments.showAll} ({comments.length - COMMENTS_PREVIEW} {t.newsDetail.more})</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </article>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {suggestedArticles.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-red-500" />
                      {t.newsDetail.moreArticles}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-3">
                    {suggestedArticles.slice(0, 4).map(a => (
                      <div key={a.id} className="flex gap-2 cursor-pointer group"
                        onClick={() => goTo(a.slug)}>
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

        {/* ── Mobile suggested articles ── */}
        {suggestedArticles.length > 0 && (
          <div className="lg:hidden mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-red-500" /> {t.newsDetail.moreArticles}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestedArticles.slice(0, 4).map(a => (
                <NewsCard key={a.id} id={a.id} title={a.title}
                  excerpt={(a.description || '').slice(0, 80) + '...'}
                  category={a.category} categorySlug={a.category_slug}
                  author={a.editor_name || a.author_name}
                  publishedAt={a.created_at}
                  readTime={getReadingTime(a.contentText || a.description)}
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
