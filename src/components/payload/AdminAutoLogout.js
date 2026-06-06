'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart', 'pointerdown']
const LOGIN_PATHS = ['/admin/login', '/admin/forgot', '/admin/create-first-user']

const clearPayloadClientStorage = () => {
  const shouldClear = (key = '') => /payload|admin|auth|token/i.test(key)

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (shouldClear(key)) localStorage.removeItem(key)
    }
  } catch (_) {
    // Storage can be blocked in private browsing or strict browser modes.
  }

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (shouldClear(key)) sessionStorage.removeItem(key)
    }
  } catch (_) {
    // Storage can be blocked in private browsing or strict browser modes.
  }

  try {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0'
    document.cookie = `payload-token=; path=/; ${expired}`
    document.cookie = `payload-token=; path=/admin; ${expired}`
    document.cookie = `payload-token=; path=/api; ${expired}`
  } catch (_) {
    // HttpOnly cookies are cleared by Payload's logout endpoint.
  }
}

export default function AdminAutoLogout() {
  const pathname = usePathname()
  const router = useRouter()
  const timerRef = useRef(null)
  const loggingOutRef = useRef(false)

  const isAdminPage = pathname?.startsWith('/admin')
  const isLoginPage = LOGIN_PATHS.some((path) => pathname?.startsWith(path))

  const logout = useCallback(async ({ keepalive = false, redirect = true } = {}) => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    clearPayloadClientStorage()

    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
        keepalive,
        headers: keepalive ? undefined : { 'Content-Type': 'application/json' },
      })
    } catch (_) {
      // Redirect anyway; the next admin request will no longer have client auth state.
    }

    if (redirect) {
      router.replace('/admin/login')
      router.refresh()
    }
  }, [router])

  const resetTimer = useCallback(() => {
    if (!isAdminPage || isLoginPage || loggingOutRef.current) return

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      logout()
    }, INACTIVITY_LIMIT_MS)
  }, [isAdminPage, isLoginPage, logout])

  useEffect(() => {
    if (!isAdminPage || isLoginPage) return undefined

    loggingOutRef.current = false
    resetTimer()

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true })
    })

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer)
      })
    }
  }, [isAdminPage, isLoginPage, resetTimer])

  useEffect(() => {
    if (!isAdminPage || isLoginPage) return undefined

    const handleTabClose = () => {
      clearPayloadClientStorage()
      try {
        fetch('/api/users/logout', {
          method: 'POST',
          credentials: 'include',
          keepalive: true,
        })
      } catch (_) {
        // Browsers may stop work during unload; best-effort cleanup above still runs.
      }
    }

    window.addEventListener('beforeunload', handleTabClose)

    return () => {
      window.removeEventListener('beforeunload', handleTabClose)
    }
  }, [isAdminPage, isLoginPage])

  return null
}
