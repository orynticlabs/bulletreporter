'use client'

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const INACTIVITY_LIMIT_MS = 10 * 60 * 1000
const ACTIVITY_STORAGE_KEY = 'br_admin_last_activity_at'
const ACTIVITY_BROADCAST_INTERVAL_MS = 5000
const FORCE_LOGOUT_ENDPOINT = '/api/admin-session/logout'
const ACTIVITY_EVENTS = [
  'click',
  'keydown',
  'keyup',
  'input',
  'change',
  'mousemove',
  'mousedown',
  'pointerdown',
  'pointermove',
  'scroll',
  'touchstart',
  'touchmove',
  'wheel',
  'focus',
]
const LOGIN_PATHS = ['/admin/login', '/admin/forgot', '/admin/create-first-user']
const LOGOUT_PATHS = ['/admin/logout', '/admin/logout-inactivity']

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
  const timerRef = useRef(null)
  const loggingOutRef = useRef(false)
  const lastActivityRef = useRef(Date.now())
  const lastBroadcastRef = useRef(0)

  const isAdminPage = pathname?.startsWith('/admin')
  const isLoginPage = LOGIN_PATHS.some((path) => pathname?.startsWith(path))
  const isLogoutPage = LOGOUT_PATHS.some((path) => pathname?.startsWith(path))
  const isManualLogoutPage =
    pathname?.startsWith('/admin/logout') && !pathname?.startsWith('/admin/logout-inactivity')

  const logout = useCallback(async ({ keepalive = false, redirect = true, inactivity = false } = {}) => {
    if (loggingOutRef.current) return
    loggingOutRef.current = true

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

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

    try {
      await fetch(FORCE_LOGOUT_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        keepalive,
      })
    } catch (_) {
      // The fallback endpoint only expires cookies; client cleanup below is still useful.
    }

    clearPayloadClientStorage()

    if (redirect) {
      const nextPath = inactivity ? '/admin/logout-inactivity' : '/admin/login'
      window.location.replace(nextPath)
    }
  }, [])

  const getStoredActivityAt = useCallback(() => {
    try {
      const stored = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY))
      return Number.isFinite(stored) ? stored : null
    } catch (_) {
      return null
    }
  }, [])

  const hasExpired = useCallback((activityAt = lastActivityRef.current) => {
    return Date.now() - activityAt >= INACTIVITY_LIMIT_MS
  }, [])

  const checkInactivity = useCallback(() => {
    const storedActivityAt = getStoredActivityAt()
    const activityAt = storedActivityAt || lastActivityRef.current

    if (hasExpired(activityAt)) {
      logout({ inactivity: true })
      return true
    }

    lastActivityRef.current = Math.max(lastActivityRef.current, activityAt)
    return false
  }, [getStoredActivityAt, hasExpired, logout])

  const resetTimer = useCallback((activityAt = Date.now()) => {
    if (!isAdminPage || isLoginPage || isLogoutPage || loggingOutRef.current) return

    lastActivityRef.current = Math.max(lastActivityRef.current, activityAt)

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    const expiresIn = Math.max(0, INACTIVITY_LIMIT_MS - (Date.now() - lastActivityRef.current))
    timerRef.current = window.setTimeout(() => {
      logout({ inactivity: true })
    }, expiresIn)
  }, [isAdminPage, isLoginPage, isLogoutPage, logout])

  const recordActivity = useCallback(() => {
    const now = Date.now()
    resetTimer(now)

    if (now - lastBroadcastRef.current < ACTIVITY_BROADCAST_INTERVAL_MS) return

    lastBroadcastRef.current = now
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
    } catch (_) {
      // Storage can be blocked; the current tab timer still works.
    }
  }, [resetTimer])

  useEffect(() => {
    if (isManualLogoutPage) {
      logout()
    }
  }, [isManualLogoutPage, logout])

  useEffect(() => {
    if (!isAdminPage || isLoginPage || isLogoutPage) return undefined

    loggingOutRef.current = false
    if (checkInactivity()) return undefined

    recordActivity()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (checkInactivity()) return
        recordActivity()
      }
    }

    const handleStorage = (event) => {
      if (event.key !== ACTIVITY_STORAGE_KEY || !event.newValue) return

      const activityAt = Number(event.newValue)
      if (Number.isFinite(activityAt)) {
        resetTimer(activityAt)
      }
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { capture: true, passive: true })
      document.addEventListener(eventName, recordActivity, { capture: true, passive: true })
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, recordActivity, { capture: true })
        document.removeEventListener(eventName, recordActivity, { capture: true })
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [checkInactivity, isAdminPage, isLoginPage, isLogoutPage, recordActivity, resetTimer])

  return null
}
