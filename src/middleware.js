import { NextResponse } from 'next/server'

const PUBLIC_FILE = /\.(.*)$/

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Skip static files, _next, api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logo') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  // If URL starts with /en, rewrite to same path without /en
  // But keep the /en in the URL (don't redirect away)
  // The page components will read lang from URL via LanguageContext
  if (pathname.startsWith('/en/') || pathname === '/en') {
    const actualPath = pathname.slice(3) || '/'
    const url = request.nextUrl.clone()
    url.pathname = actualPath

    const response = NextResponse.rewrite(url)
    // Set cookie so context can read it server-side if needed
    response.cookies.set('NEXT_LOCALE', 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax'
    })
    return response
  }

  // For non-/en paths, clear English cookie (user is on Hindi)
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie === 'en' && !pathname.startsWith('/en')) {
    // User manually navigated to non-en URL, clear cookie
    const response = NextResponse.next()
    response.cookies.set('NEXT_LOCALE', 'hi', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)',
  ],
}
