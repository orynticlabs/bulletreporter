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
const CREATE_USER_PATH = '/admin/collections/users/create'
const USER_EDIT_PATH_PATTERN = /^\/admin\/collections\/users\/([^/?#]+)$/
const CREATE_USER_NOTICE_ID = 'br-user-password-setup-notice'
const CREATE_USER_ROOT_CLASS = 'br-create-user-without-password'
const PASSWORD_TOGGLE_CLASS = 'br-admin-password-toggle'
const PASSWORD_TOGGLE_STYLE_ID = 'br-admin-password-toggle-style'
const RESEND_SETUP_ID = 'br-resend-password-setup'
const RESEND_SETUP_WRAP_ID = 'br-resend-password-setup-wrap'
const isCreateUserPath = (pathname) =>
  pathname === CREATE_USER_PATH || pathname?.startsWith(`${CREATE_USER_PATH}/`)
const getEditableUserIdFromPath = (pathname) => {
  const match = pathname?.match(USER_EDIT_PATH_PATTERN)
  const userId = match?.[1]

  if (!userId || userId === 'create') return null

  return userId
}

const eyeIcon = `
  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
    <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
  </svg>
`

const eyeOffIcon = `
  <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
    <path d="m3 3 18 18" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
    <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
    <path d="M9.88 5.45A10.7 10.7 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a19.1 19.1 0 0 1-2.21 2.98" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
    <path d="M6.28 6.95C3.72 8.67 2.25 12 2.25 12S6 18.75 12 18.75c1.66 0 3.15-.52 4.43-1.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/>
  </svg>
`

const ensurePasswordToggleStyles = () => {
  if (document.getElementById(PASSWORD_TOGGLE_STYLE_ID)) return

  const style = document.createElement('style')
  style.id = PASSWORD_TOGGLE_STYLE_ID
  style.textContent = `
    .${CREATE_USER_ROOT_CLASS} .auth-fields__changing-password,
    .${CREATE_USER_ROOT_CLASS} .auth-fields .password,
    .${CREATE_USER_ROOT_CLASS} .auth-fields .confirm-password,
    .${CREATE_USER_ROOT_CLASS} .auth-fields .field-type:has(input[type="password"]),
    .${CREATE_USER_ROOT_CLASS} .auth-fields .field-type:has(input[name="password"]),
    .${CREATE_USER_ROOT_CLASS} .auth-fields .field-type:has(input[name="confirmPassword"]),
    .${CREATE_USER_ROOT_CLASS} .auth-fields .field-type:has(input[name="confirm-password"]),
    .${CREATE_USER_ROOT_CLASS} .auth-fields__controls,
    .${CREATE_USER_ROOT_CLASS} .collection-edit--users .auth-fields__changing-password,
    .${CREATE_USER_ROOT_CLASS} .collection-edit--users .auth-fields__controls:empty {
      display: none !important;
    }

    .${PASSWORD_TOGGLE_CLASS} {
      align-items: center;
      background: transparent;
      border: 0;
      color: var(--theme-elevation-600);
      cursor: pointer;
      display: inline-flex;
      height: 32px;
      justify-content: center;
      padding: 0;
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      width: 32px;
      z-index: 1;
    }

    .${PASSWORD_TOGGLE_CLASS}:hover,
    .${PASSWORD_TOGGLE_CLASS}:focus-visible {
      color: var(--theme-text);
    }

    #${RESEND_SETUP_ID} {
      align-items: center;
      background: var(--theme-success-500, #16a34a);
      border: 1px solid color-mix(in srgb, var(--theme-success-500, #16a34a), #ffffff 18%);
      border-radius: 6px;
      box-shadow: 0 8px 22px rgba(0, 0, 0, .18);
      color: #ffffff;
      cursor: pointer;
      display: inline-flex;
      font: inherit;
      font-weight: 600;
      gap: 8px;
      justify-content: center;
      line-height: 1.4;
      min-height: 40px;
      padding: 9px 15px;
      transition: background .16s ease, border-color .16s ease, box-shadow .16s ease, transform .16s ease;
      white-space: nowrap;
    }

    #${RESEND_SETUP_ID}::before {
      content: '↻';
      font-size: 16px;
      line-height: 1;
    }

    #${RESEND_SETUP_ID}:hover,
    #${RESEND_SETUP_ID}:focus-visible {
      background: var(--theme-success-600, #15803d);
      border-color: color-mix(in srgb, var(--theme-success-500, #16a34a), #ffffff 28%);
      box-shadow: 0 10px 26px rgba(0, 0, 0, .24);
      transform: translateY(-1px);
    }

    #${RESEND_SETUP_ID}:disabled {
      cursor: not-allowed;
      opacity: .55;
      transform: none;
    }

    #${RESEND_SETUP_WRAP_ID} {
      align-items: center;
      display: flex;
      justify-content: flex-end;
      margin: 0 0 18px;
      width: 100%;
    }

    @media (max-width: 640px) {
      #${RESEND_SETUP_WRAP_ID} {
        justify-content: stretch;
      }

      #${RESEND_SETUP_ID} {
        width: 100%;
      }
    }
  `
  document.head.append(style)
}

const hideCreateUserPasswordFields = () => {
  ensurePasswordToggleStyles()

  document.documentElement.classList.add(CREATE_USER_ROOT_CLASS)
  document.getElementById(RESEND_SETUP_ID)?.remove()
  document.getElementById(RESEND_SETUP_WRAP_ID)?.remove()
  window.__brCreateUserTempPassword =
    window.__brCreateUserTempPassword ||
    Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')

  document
    .querySelectorAll(
      '.auth-fields input[type="password"], .auth-fields input[name="password"], .auth-fields input[name="confirmPassword"], .auth-fields input[name="confirm-password"], .collection-edit--users input[type="password"], .collection-edit--users input[name="password"], .collection-edit--users input[name="confirmPassword"], .collection-edit--users input[name="confirm-password"]',
    )
    .forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return

      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set

      if (valueSetter) {
        valueSetter.call(input, window.__brCreateUserTempPassword)
      } else {
        input.value = window.__brCreateUserTempPassword
      }

      input.disabled = false
      input.setAttribute('aria-hidden', 'true')
      input.setAttribute('autocomplete', 'new-password')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))

      const field =
        input.closest('.auth-fields__changing-password') ||
        input.closest('.field-type') ||
        input.closest('[class*="field"]') ||
        input.parentElement

      if (field instanceof HTMLElement) {
        field.style.display = 'none'
        field.setAttribute('aria-hidden', 'true')
      }
    })

  document
    .querySelectorAll('label, .field-label, [class*="label"]')
    .forEach((label) => {
      if (!(label instanceof HTMLElement)) return

      const labelText = label.textContent?.replace(/\s*\*\s*$/, '').trim().toLowerCase()
      if (!['new password', 'confirm password', 'password'].includes(labelText || '')) return

      const field =
        label.closest('.field-type') ||
        label.closest('[class*="field-type"]') ||
        label.closest('[class*="field"]') ||
        label.parentElement

      if (field instanceof HTMLElement) {
        field.style.display = 'none'
        field.setAttribute('aria-hidden', 'true')
      }
    })

  document
    .querySelectorAll(
      '.auth-fields__changing-password, .auth-fields .password, .auth-fields .confirm-password, .auth-fields .field-type:has(input[type="password"]), .auth-fields .field-type:has(input[name="password"]), .auth-fields .field-type:has(input[name="confirmPassword"]), .auth-fields .field-type:has(input[name="confirm-password"]), .auth-fields__controls, .collection-edit--users .auth-fields__changing-password, .collection-edit--users .auth-fields__controls:empty',
    )
    .forEach((section) => {
      if (section instanceof HTMLElement) {
        section.style.display = 'none'
        section.setAttribute('aria-hidden', 'true')
      }
    })

  if (!document.getElementById(CREATE_USER_NOTICE_ID)) {
    const form = document.querySelector('form')
    const notice = document.createElement('div')
    notice.id = CREATE_USER_NOTICE_ID
    notice.textContent = 'Password setup email will be sent automatically after saving this user.'
    notice.style.border = '1px solid var(--theme-elevation-150)'
    notice.style.borderRadius = '4px'
    notice.style.color = 'var(--theme-text)'
    notice.style.margin = '0 0 20px'
    notice.style.padding = '12px 14px'

    form?.prepend(notice)
  }
}

const addPasswordVisibilityToggles = () => {
  ensurePasswordToggleStyles()

  document
    .querySelectorAll('input[type="password"], input[name="password"], input[name="confirm-password"]')
    .forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return
      if (input.disabled || input.hidden || input.getAttribute('aria-hidden') === 'true') return
      if (input.closest('[aria-hidden="true"]')) return
      if (input.dataset.brPasswordToggle === 'true') return

      const parent = input.parentElement
      if (!(parent instanceof HTMLElement)) return

      parent.style.position = parent.style.position || 'relative'
      input.style.paddingRight = '48px'
      input.dataset.brPasswordToggle = 'true'

      const button = document.createElement('button')
      button.type = 'button'
      button.className = PASSWORD_TOGGLE_CLASS
      button.setAttribute('aria-label', 'Show password')
      button.setAttribute('title', 'Show password')
      button.innerHTML = eyeIcon

      button.addEventListener('click', () => {
        const isVisible = input.type === 'text'

        input.type = isVisible ? 'password' : 'text'
        button.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password')
        button.setAttribute('title', isVisible ? 'Show password' : 'Hide password')
        button.innerHTML = isVisible ? eyeIcon : eyeOffIcon
      })

      input.insertAdjacentElement('afterend', button)
    })
}

const addResendPasswordSetupButton = (pathname) => {
  ensurePasswordToggleStyles()

  const userId = getEditableUserIdFromPath(pathname)

  if (!userId || document.getElementById(RESEND_SETUP_ID)) return

  const form = document.querySelector('form')
  if (!form) return

  const wrapper = document.createElement('div')
  wrapper.id = RESEND_SETUP_WRAP_ID

  const button = document.createElement('button')
  button.id = RESEND_SETUP_ID
  button.type = 'button'
  button.textContent = 'Resend password setup email'

  button.addEventListener('click', async () => {
    button.disabled = true
    button.textContent = 'Sending...'

    try {
      const response = await fetch('/api/users/resend-password-setup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      })

      if (!response.ok) {
        throw new Error('Unable to send password setup email')
      }

      button.textContent = 'Password setup email sent'
    } catch (_) {
      button.disabled = false
      button.textContent = 'Try resend again'
    }
  })

  wrapper.append(button)
  form.parentElement?.insertBefore(wrapper, form)
}

const clearCreateUserPasswordUI = () => {
  document.documentElement.classList.remove(CREATE_USER_ROOT_CLASS)
  document.getElementById(CREATE_USER_NOTICE_ID)?.remove()
  delete window.__brCreateUserTempPassword
}

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
    if (!isAdminPage) return undefined

    if (isCreateUserPath(pathname)) {
      return undefined
    }

    addPasswordVisibilityToggles()

    const observer = new MutationObserver(addPasswordVisibilityToggles)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isAdminPage, pathname])

  useEffect(() => {
    if (!isCreateUserPath(pathname)) {
      clearCreateUserPasswordUI()
      return undefined
    }

    hideCreateUserPasswordFields()

    const observer = new MutationObserver(hideCreateUserPasswordFields)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      clearCreateUserPasswordUI()
    }
  }, [pathname])

  useEffect(() => {
    if (!isAdminPage || !getEditableUserIdFromPath(pathname)) return undefined

    addResendPasswordSetupButton(pathname)

    const observer = new MutationObserver(() => addResendPasswordSetupButton(pathname))
    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isAdminPage, pathname])

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
