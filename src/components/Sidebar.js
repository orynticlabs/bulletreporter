'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Cloud, Wind, Droplets, RefreshCw, TrendingUp, Tag } from 'lucide-react'
import axios from 'axios'
import { useLanguage } from '@/contexts/LanguageContext'

function Sidebar() {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL

  const [weatherData, setWeatherData] = useState({
    temperature: null, humidity: null, windSpeed: null,
    description: '', city: '', loading: true, error: null, lastUpdated: null
  })

  const fetchWeatherData = useCallback(async () => {
    try {
      setWeatherData(prev => ({ ...prev, loading: true, error: null }))
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      const city = 'Bhopal'
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${lang === 'en' ? 'en' : 'hi'}`,
        { next: { revalidate: 600 } }
      )
      if (!response.ok) throw new Error('Weather API error')
      const data = await response.json()
      setWeatherData({
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6),
        description: data.weather[0]?.description || '',
        city: data.name,
        loading: false,
        error: null,
        lastUpdated: new Date().toLocaleTimeString(lang === 'en' ? 'en-IN' : 'hi-IN', { hour: '2-digit', minute: '2-digit' })
      })
    } catch {
      setWeatherData(prev => ({ ...prev, loading: false, error: t.sidebar.weatherError }))
    }
  }, [lang]) // eslint-disable-line

  useEffect(() => {
    fetchWeatherData()
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchWeatherData])

  const { data: trendingData = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending', lang],
    queryFn: async () => {
      const res = await axios.get(`${apiUrl}/news`, { params: { limit: 6, offset: 0 }, timeout: 15000 })
      return res.data.articles || []
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-sidebar'],
    queryFn: async () => {
      const res = await axios.get(`${apiUrl}/categories`, { timeout: 15000 })
      return res.data || []
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  })

  // Normalize categories response (Payload returns { docs: [...] } sometimes)
  const categoriesArray = Array.isArray(categories)
    ? categories
    : (categories && (Array.isArray(categories.docs) ? categories.docs : []))

  const getLangPath = useCallback((path) => lang === 'en' ? `/en${path}` : path, [lang])

  return (
    <div className="space-y-6">
      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            {t.sidebar.weather}
          </h3>
          <button onClick={fetchWeatherData} className="hover:bg-white/20 p-1 rounded-full transition-colors" title={t.sidebar.refreshWeather}>
            <RefreshCw className={`w-4 h-4 ${weatherData.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {weatherData.loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-white/30 rounded w-24"></div>
            <div className="h-4 bg-white/30 rounded w-32"></div>
          </div>
        ) : weatherData.error ? (
          <div className="text-center">
            <p className="text-sm text-white/80 mb-2">{weatherData.error}</p>
            <button onClick={fetchWeatherData} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors">
              {t.sidebar.retryWeather}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-bold">{weatherData.temperature}°C</span>
            </div>
            <p className="text-white/90 text-sm capitalize mb-3">{weatherData.description}</p>
            <p className="text-white/80 text-xs mb-3">{weatherData.city}</p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Droplets className="w-4 h-4 text-blue-200" />
                <span>{t.sidebar.humidity}: {weatherData.humidity}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-4 h-4 text-blue-200" />
                <span>{weatherData.windSpeed} km/h</span>
              </div>
            </div>
            {weatherData.lastUpdated && (
              <p className="text-white/60 text-xs mt-2">{t.sidebar.updatedAt}: {weatherData.lastUpdated}</p>
            )}
          </div>
        )}
      </div>

      {/* Trending News */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-bold text-xl text-primary mb-4 flex items-center gap-2 border-b pb-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          {t.sidebar.trending}
        </h3>
        {trendingLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : trendingData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">{t.sidebar.noTrending}</p>
        ) : (
          <div className="space-y-3">
            {trendingData.map((news, index) => (
              <div key={news.id}
                className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors group"
                onClick={() => router.push(getLangPath(`/news/${news.slug}`))}
              >
                <div className="relative w-16 h-16 flex-shrink-0">
                  {news.image_url ? (
                    <img src={news.image_url} alt={news.title}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold text-lg">{index + 1}</span>
                    </div>
                  )}
                  <div className="absolute -top-1 -left-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 line-clamp-3 group-hover:text-red-600 transition-colors">
                  {news.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-bold text-xl text-primary mb-4 flex items-center gap-2 border-b pb-2">
          <Tag className="w-5 h-5 text-red-500" />
          {t.sidebar.categories}
        </h3>
        {categoriesLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : categoriesArray.length === 0 ? (
          <p className="text-gray-500 text-sm">{t.sidebar.noCategories}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categoriesArray.map(cat => (
              <button key={cat.id || cat.name}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-sm font-medium rounded-full transition-colors border border-red-200"
                onClick={() => router.push(getLangPath(`/category/${encodeURIComponent(cat.name)}`))}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
