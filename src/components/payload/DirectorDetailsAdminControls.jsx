'use client'

import { useEffect } from 'react'

const BODY_CLASS = 'br-director-details-exists'
const STYLE_ID = 'br-director-details-singleton-style'

const ensureSingletonStyle = () => {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    body.${BODY_CLASS} a[href$="/admin/collections/director-details/create"],
    body.${BODY_CLASS} a[href*="/admin/collections/director-details/create?"] {
      display: none !important;
    }
  `
  document.head.appendChild(style)
}

export function DirectorDetailsAdminControls() {
  useEffect(() => {
    let cancelled = false
    ensureSingletonStyle()

    fetch('/api/director-details?limit=1&depth=0', {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled && Number(data?.totalDocs) > 0) {
          document.body.classList.add(BODY_CLASS)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      document.body.classList.remove(BODY_CLASS)
    }
  }, [])

  return null
}
