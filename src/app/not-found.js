'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center px-4">
        <div className="text-8xl mb-4">📰</div>
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-2">Oops! Page not found</p>
        <p className="text-gray-500 mb-8">पेज नहीं मिला — The page you are looking for is not available.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
            होम पर जाएं / Go Home
          </Link>
          <Link href="/en" className="border border-red-600 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-medium">
            English Site
          </Link>
        </div>
      </div>
    </div>
  )
}
