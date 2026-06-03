'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useLanguage } from '@/contexts/LanguageContext'
import { DUMMY_ARTICLES } from '@/data/dummyArticles'
import {
  Clock, Eye, User, Calendar, ArrowLeft, Share2,
  Heart, MessageCircle, Facebook, Twitter, Tag,
  ThumbsUp, Send, ChevronRight, BookOpen
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const WhatsAppIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.534 5.855L0 24l6.29-1.512A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.52-5.2-1.424l-.374-.22-3.733.897.933-3.64-.242-.374A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)

export default function ArticleDetail() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLanguage()
  const { toast } = useToast()

  const article = DUMMY_ARTICLES.find(a => a.slug === params.slug)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article?.likes || 0)
  const [comments, setComments] = useState([
    { id: 1, name: 'रवि कुमार', text: 'बहुत अच्छा लेख है। इससे काफी जानकारी मिली।', date: '2 जून 2026', likes: 5 },
    { id: 2, name: 'प्रीति शर्मा', text: 'यह लेख पढ़कर बहुत अच्छा लगा। लेखक को बधाई।', date: '1 जून 2026', likes: 3 },
  ])
  const [commentName, setCommentName] = useState('')
  const [commentText, setCommentText] = useState('')
  const [views] = useState(article?.views || 0)

  const getLangPath = useCallback((p) => lang === 'en' ? `/en${p}` : p, [lang])
  const relatedArticles = DUMMY_ARTICLES.filter(a => a.id !== article?.id && a.category === article?.category).slice(0, 3)
  const otherArticles = DUMMY_ARTICLES.filter(a => a.id !== article?.id).slice(0, 3)
  const related = relatedArticles.length > 0 ? relatedArticles : otherArticles

  if (!article) return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-4">लेख नहीं मिला</h1>
        <button onClick={() => router.push(getLangPath('/'))}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700">
          होम पर जाएं
        </button>
      </div>
    </Layout>
  )

  const handleLike = () => {
    if (liked) {
      setLikeCount(c => c - 1)
      setLiked(false)
      toast({ title: 'Like हटाया गया' })
    } else {
      setLikeCount(c => c + 1)
      setLiked(true)
      toast({ title: '❤️ आपने Like किया!' })
    }
  }

  const handleShare = (platform) => {
    const url = window.location.href
    const text = encodeURIComponent(article.title)
    const links = {
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
    }
    window.open(links[platform], '_blank', 'width=600,height=400')
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    toast({ title: '🔗 लिंक कॉपी हो गया!' })
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    if (!commentName.trim() || !commentText.trim()) {
      toast({ title: 'सभी फ़ील्ड भरें', variant: 'destructive' })
      return
    }
    const newComment = {
      id: comments.length + 1,
      name: commentName.trim(),
      text: commentText.trim(),
      date: new Date().toLocaleDateString('hi-IN'),
      likes: 0,
    }
    setComments(prev => [newComment, ...prev])
    setCommentName('')
    setCommentText('')
    toast({ title: '✅ टिप्पणी जोड़ी गई!' })
  }

  return (
    <Layout>
      <main className="container mx-auto px-4 py-6">

        {/* Back Button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 mb-6 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> वापस जाएं
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-3">

            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden h-56 sm:h-72 md:h-96 mb-6 shadow-lg">
              <img src={article.image} alt={article.title}
                className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {article.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug mb-4">
              {article.title}
            </h1>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 md:gap-5 text-sm text-gray-500 pb-4 mb-4 border-b border-gray-200">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-red-500" /> {article.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-red-500" /> {article.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-500" /> {article.readTime} मिनट पढ़ें
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-red-500" /> {views.toLocaleString()} व्यूज़
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-red-500" /> {comments.length} टिप्पणियां
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500" /> {likeCount} लाइक्स
              </span>
            </div>

            {/* Article Body */}
            <div className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: article.content }} />

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1 text-sm text-gray-500 font-medium">
                  <Tag className="w-4 h-4" /> टैग्स:
                </span>
                {article.tags.map(tag => (
                  <span key={tag} className="bg-red-50 text-red-600 text-xs font-medium px-3 py-1 rounded-full border border-red-100 hover:bg-red-600 hover:text-white transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Like + Share */}
            <div className="bg-gray-50 rounded-2xl p-4 md:p-5 mb-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all text-sm ${liked ? 'bg-red-600 text-white shadow-md scale-105' : 'bg-white border-2 border-red-200 text-red-600 hover:border-red-600'}`}>
                  <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
                  {likeCount} {liked ? 'Liked!' : 'Like'}
                </button>
                <span className="flex items-center gap-1 text-sm text-gray-500 font-medium ml-2">
                  <Share2 className="w-4 h-4" /> शेयर करें:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleShare('whatsapp')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition-colors font-medium">
                  <WhatsAppIcon /> WhatsApp
                </button>
                <button onClick={() => handleShare('facebook')}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors font-medium">
                  <Facebook className="w-4 h-4" /> Facebook
                </button>
                <button onClick={() => handleShare('twitter')}
                  className="flex items-center gap-2 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs rounded-lg transition-colors font-medium">
                  <Twitter className="w-4 h-4" /> Twitter
                </button>
                <button onClick={handleCopyLink}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition-colors font-medium">
                  🔗 लिंक कॉपी
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="bg-red-600 px-5 py-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-white" />
                <h2 className="text-white font-bold text-lg">
                  टिप्पणियां ({comments.length})
                </h2>
              </div>

              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="p-4 md:p-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">अपनी टिप्पणी लिखें</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="आपका नाम *"
                    value={commentName}
                    onChange={e => setCommentName(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-full"
                  />
                  <input
                    type="email"
                    placeholder="ईमेल (वैकल्पिक)"
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 w-full"
                  />
                </div>
                <textarea
                  placeholder="अपनी टिप्पणी यहाँ लिखें... *"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none mb-3"
                />
                <button type="submit"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <Send className="w-4 h-4" /> टिप्पणी जोड़ें
                </button>
              </form>

              {/* Comments List */}
              <div className="divide-y divide-gray-100">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>अभी कोई टिप्पणी नहीं। पहले टिप्पणी करें!</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 p-4 md:p-5 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{c.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.date}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-2 transition-colors">
                          <ThumbsUp className="w-3 h-3" /> {c.likes} Helpful
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-red-500" /> लेख की जानकारी
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { icon: User, label: 'लेखक', value: article.author },
                    { icon: Calendar, label: 'तारीख', value: article.date },
                    { icon: Clock, label: 'पढ़ने का समय', value: `${article.readTime} मिनट` },
                    { icon: Eye, label: 'व्यूज़', value: views.toLocaleString() },
                    { icon: Heart, label: 'लाइक्स', value: likeCount.toString() },
                    { icon: MessageCircle, label: 'टिप्पणियां', value: comments.length.toString() },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Icon className="w-3.5 h-3.5 text-red-400" /> {label}
                      </span>
                      <span className="font-medium text-gray-700 text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {related.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-red-600 px-4 py-2.5 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-white" />
                    <h3 className="text-white font-bold text-sm">और लेख पढ़ें</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {related.map(a => (
                      <div key={a.id}
                        className="flex gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors group"
                        onClick={() => router.push(getLangPath(`/article/${a.slug}`))}>
                        <img src={a.image} alt={a.title}
                          className="w-14 h-14 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 group-hover:text-red-600 line-clamp-2 transition-colors">
                            {a.title}
                          </p>
                          <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {a.readTime} मिनट
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related Articles Mobile */}
        {related.length > 0 && (
          <div className="lg:hidden mt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-red-500" /> और लेख पढ़ें
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map(a => (
                <div key={a.id}
                  className="flex gap-3 bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => router.push(getLangPath(`/article/${a.slug}`))}>
                  <img src={a.image} alt={a.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0" loading="lazy" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-red-600 line-clamp-2 transition-colors">
                      {a.title}
                    </p>
                    <span className="text-xs text-gray-400">{a.readTime} मिनट</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </Layout>
  )
}