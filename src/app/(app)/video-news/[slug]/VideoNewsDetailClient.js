'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import Sidebar from '@/components/Sidebar'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Calendar, ChevronDown, ChevronRight, ChevronUp,
  Clock, Eye, Facebook, MessageCircle, Play, Send, Share2,
  ThumbsDown, ThumbsUp, Twitter, User, Video, Zap,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { getRelativeTime } from '@/utils/dateUtils'
import { getReadingTime } from '@/utils/timeUtils'
import {
  fetchPayloadVideoNewsBySlug,
  fetchPayloadVideoNews,
  normalizeRouteSlug,
} from '@/utils/payloadArticles'
import { getRecaptchaToken } from '@/utils/recaptcha'

const STORAGE_KEY = 'br_vn_reactions'

// ── WhatsApp icon ────────────────────────────────────────────────────────────
const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.534 5.855L0 24l6.29-1.512A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.52-5.2-1.424l-.374-.22-3.733.897.933-3.64-.242-.374A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
  </svg>
)

function getStoredReactions() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function setStoredReaction(slug, type) {
  const store = getStoredReactions()
  if (type === null) delete store[slug]
  else store[slug] = type
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// ── Comment card ─────────────────────────────────────────────────────────────
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

// ── Suggested video mini-card ─────────────────────────────────────────────────
function SuggestedVideoCard({ video, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex gap-3 cursor-pointer group hover:bg-red-50 rounded-xl p-2 border border-transparent hover:border-red-100 transition-all"
    >
      <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
        {video.image_url ? (
          <img src={video.image_url} alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
            <Play className="w-5 h-5 text-red-400 fill-red-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
            <Play className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        {video.category && (
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">{video.category}</span>
        )}
        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-3 leading-snug mt-0.5">
          {video.title}
        </p>
        {video.created_at && (
          <span className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{getRelativeTime(video.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VideoNewsDetailClient({ initialVideo = null }) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t, lang } = useLanguage()
  const queryClient = useQueryClient()
  const slug = normalizeRouteSlug(params?.slug || initialVideo?.slug || '')

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const goTo = useCallback((s) => router.push(getLangPath(`/video-news/${encodeURIComponent(s)}`)), [router, getLangPath])

  // ── State ────────────────────────────────────────────────────────────────
  const [commentName, setCommentName]   = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText]   = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)
  const COMMENTS_PREVIEW = 3

  const [reaction, setReaction]           = useState(null)
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 })
  const [liveViews, setLiveViews]         = useState(null)
  const viewFired = useRef(false)

  // Scroll to top on slug change
  useEffect(() => { window.scrollTo(0, 0) }, [slug])

  // ── Fetch video ──────────────────────────────────────────────────────────
  const { data: video, isLoading, error } = useQuery({
    queryKey: ['video-news-detail', slug, lang],
    queryFn: () => fetchPayloadVideoNewsBySlug(slug, { lang }),
    initialData: lang === 'hi' ? (initialVideo || undefined) : undefined,
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Sync counts when video loads
  useEffect(() => {
    if (!video) return
    setReactionCounts({ likes: video.likes || 0, dislikes: video.dislikes || 0 })
    setLiveViews(video.views || 0)
    const stored = getStoredReactions()
    setReaction(stored[video.slug] ?? null)
  }, [video?.id])

  // ── Fire view once per session ───────────────────────────────────────────
  useEffect(() => {
    if (!video?.slug || viewFired.current) return
    const sessionKey = `br_vn_viewed_${video.slug}`
    if (sessionStorage.getItem(sessionKey)) return
    viewFired.current = true
    sessionStorage.setItem(sessionKey, '1')

    getRecaptchaToken('video_view')
      .then((recaptchaToken) => fetch(`/api/public/video-news/${encodeURIComponent(video.slug)}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recaptchaToken }),
      }))
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.views != null) setLiveViews(data.views) })
      .catch(() => {})
  }, [video?.slug])

  // ── Suggested videos (same category) ────────────────────────────────────
  const { data: suggestedData } = useQuery({
    queryKey: ['suggested-videos', video?.category_slug, lang],
    queryFn: () => fetchPayloadVideoNews({ category: video.category_slug || video.category, limit: 7, lang }),
    enabled: !!(video?.category_slug || video?.category),
    staleTime: 5 * 60 * 1000,
  })
  const suggestedVideos = (suggestedData?.videos || []).filter(v => v.slug !== slug).slice(0, 6)

  // ── Comments ─────────────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['video-comments', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/video-news/${encodeURIComponent(slug)}/comments`)
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
      const recaptchaToken = await getRecaptchaToken('video_comment')
      const res = await fetch(`/api/public/video-news/${encodeURIComponent(slug)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, recaptchaToken }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['video-comments', slug])
      setCommentName('')
      setCommentEmail('')
      setCommentText('')
      setNewsletterOptIn(false)
      toast({ title: t.comments.submitted, description: t.comments.pending })
    },
    onError: () => toast({ title: t.common.error, variant: 'destructive' }),
  })

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      toast({ title: t.common.fillRequired, variant: 'destructive' })
      return
    }
    commentMutation.mutate({
      authorName: commentName.trim(),
      authorEmail: commentEmail.trim(),
      content: commentText.trim(),
      subscribeToNewsletter: newsletterOptIn,
    })
  }

  // ── React (like / dislike) ───────────────────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: async ({ type, action }) => {
      const recaptchaToken = await getRecaptchaToken('video_reaction')
      const res = await fetch(`/api/public/video-news/${encodeURIComponent(slug)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, recaptchaToken }),
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    onSuccess: (data) => {
      setReactionCounts({ likes: data.likes, dislikes: data.dislikes })
    },
    onError: () => {
      const stored = getStoredReactions()
      setReaction(stored[slug] ?? null)
      setReactionCounts({ likes: video?.likes || 0, dislikes: video?.dislikes || 0 })
    },
  })

  const handleReact = async (type) => {
    if (reactMutation.isPending) return
    const isActive = reaction === type
    const newReaction = isActive ? null : type

    setReaction(newReaction)
    setStoredReaction(slug, newReaction)

    const updates = { ...reactionCounts }
    if (reaction === 'like'    && type === 'dislike') updates.likes    = Math.max(0, updates.likes - 1)
    if (reaction === 'dislike' && type === 'like')    updates.dislikes = Math.max(0, updates.dislikes - 1)
    if (isActive) {
      if (type === 'like') updates.likes = Math.max(0, updates.likes - 1)
      else updates.dislikes = Math.max(0, updates.dislikes - 1)
    } else {
      if (type === 'like') updates.likes += 1
      else updates.dislikes += 1
    }
    setReactionCounts(updates)

    if (reaction && reaction !== type) {
      const recaptchaToken = await getRecaptchaToken('video_reaction')
      fetch(`/api/public/video-news/${encodeURIComponent(slug)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reaction, action: 'remove', recaptchaToken }),
      }).catch(() => {})
    }
    reactMutation.mutate({ type, action: isActive ? 'remove' : 'add' })
  }

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = useCallback((platform) => {
    const origin       = window.location.origin
    const canonicalUrl = `${origin}/video-news/${slug}`
    const shareTitle   = video?.title || ''
    const boldTitle    = shareTitle ? `*${shareTitle}*` : ''
    const shareMessage = [boldTitle, canonicalUrl].filter(Boolean).join('\n\n')
    const encodedUrl   = encodeURIComponent(canonicalUrl)
    const encodedTitle = encodeURIComponent(shareTitle)
    const encodedMsg   = encodeURIComponent(shareMessage)

    const urls = {
      whatsapp: `https://wa.me/?text=${encodedMsg}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }, [video, slug])

  // ── Render states ────────────────────────────────────────────────────────
  if (isLoading) return <Layout><div className="container mx-auto px-4 py-16"><LoadingSpinner size="lg" /></div></Layout>

  if (error || !video) return (
    <Layout>
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">{t.newsDetail.articleNotFound}</h1>
        <p className="text-gray-500 mb-6">{t.newsDetail.articleNotFoundDesc}</p>
        <Button onClick={() => router.push(getLangPath('/video-news'))} className="bg-red-600 hover:bg-red-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t.newsDetail.goHome}
        </Button>
      </div>
    </Layout>
  )

  const isLiked    = reaction === 'like'
  const isDisliked = reaction === 'dislike'

  return (
    <Layout>
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

              {/* YouTube or uploaded Cloudinary video */}
              <div className="relative aspect-video bg-gray-950">
                {video.youtube_embed_url ? (
                  <iframe
                    src={`${video.youtube_embed_url}?rel=0&modestbranding=1`}
                    title={video.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : video.uploaded_video_url ? (
                  <video
                    src={video.uploaded_video_url}
                    poster={video.uploaded_video_poster || video.thumbnail_url || undefined}
                    title={video.title}
                    className="h-full w-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-950 to-gray-950">
                    <Play className="h-16 w-16 fill-white text-white opacity-80" />
                  </div>
                )}
              </div>

              <CardContent className="p-4 md:p-6 lg:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-red-600 text-white flex items-center gap-1">
                    <Video className="w-3 h-3" /> {t.home.videoNews}
                  </Badge>
                  {(video.categories?.length ? video.categories : [video.category]).filter(Boolean).map((category, index) => (
                    <Badge
                      key={`${category}-${index}`}
                      variant="outline"
                      className="text-red-600 border-red-200 cursor-pointer hover:bg-red-50"
                      onClick={() => router.push(getLangPath(`/category/${encodeURIComponent(video.category_slugs?.[index] || category)}`))}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                  {video.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-500 mb-6 pb-4 border-b">
                  {(video.editor_name || video.author_name) && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {video.editor_name || video.author_name}
                    </span>
                  )}
                  {video.created_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {getRelativeTime(video.created_at)}
                    </span>
                  )}
                  {(video.contentText || video.description) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {getReadingTime(video.contentText || video.description)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    {(liveViews ?? 0).toLocaleString()} {t.newsDetail.views}
                  </span>
                </div>

                {/* Description */}
                {video.description && (
                  <p className="mb-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-base font-semibold leading-relaxed text-gray-800 rounded-r-lg">
                    {video.description}
                  </p>
                )}

                {/* Content body */}
                {video.content && (
                  <div
                    className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: video.content }}
                  />
                )}

                {/* ── Like / Dislike ── */}
                <div className="mt-6 pt-5 border-t">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
                    {t.newsDetail.helpfulQuestion}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
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
                    <button onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm rounded-lg transition-colors">
                      <span className="font-black leading-none">in</span> LinkedIn
                    </button>
                    <button onClick={() => handleShare('telegram')}
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm rounded-lg transition-colors">
                      <Send className="w-4 h-4" /> Telegram
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/video-news/${slug}`
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
                      placeholder={`${t.comments.emailPlaceholder} *`}
                      type="email"
                      value={commentEmail}
                      onChange={e => setCommentEmail(e.target.value)}
                      className="text-sm bg-white"
                      required
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
                  <label
                    htmlFor="video-newsletter-opt-in"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-gray-800 cursor-pointer select-none"
                  >
                    <input
                      id="video-newsletter-opt-in"
                      data-testid="newsletter-opt-in"
                      type="checkbox"
                      checked={newsletterOptIn}
                      onChange={e => setNewsletterOptIn(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-red-600"
                    />
                    <span className="font-medium">{t.comments.newsletterOptIn}</span>
                  </label>
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

            {/* ── Suggested Videos ── */}
            {suggestedVideos.length > 0 && (
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Zap className="w-5 h-5 text-red-500 fill-red-100" />
                    {t.suggested.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {suggestedVideos.map(v => (
                      <SuggestedVideoCard key={v.id} video={v} onClick={() => goTo(v.slug)} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </article>

          {/* ── Sidebar ── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Sidebar />
            </div>
          </aside>
        </div>

      </main>
    </Layout>
  )
}
