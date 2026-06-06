'use client'

import { useEffect, useState } from 'react'
import { CONTENT_REFETCH_INTERVAL } from '@/utils/queryConfig'

/**
 * AutoRefreshBadge
 *
 * Shows a pulsing green dot + countdown until the next auto-refresh.
 * Purely cosmetic — the actual refreshing is driven by React Query's
 * refetchInterval on each individual query.
 *
 * Props:
 *   className  – extra Tailwind classes for positioning
 *   label      – optional text prefix (e.g. "Auto-refresh")
 */
export default function AutoRefreshBadge({ className = '', label }) {
  const [secondsLeft, setSecondsLeft] = useState(CONTENT_REFETCH_INTERVAL / 1000)
  const [justRefreshed, setJustRefreshed] = useState(false)

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Flash "just refreshed" briefly
          setJustRefreshed(true)
          setTimeout(() => setJustRefreshed(false), 1500)
          return CONTENT_REFETCH_INTERVAL / 1000
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const countdown = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] text-gray-400 font-medium select-none ${className}`}>
      {/* Pulsing dot */}
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        justRefreshed ? 'bg-green-500 animate-ping' : 'bg-green-400 animate-pulse'
      }`} />
      {label && <span>{label}</span>}
      <span className="tabular-nums">{justRefreshed ? '✓' : countdown}</span>
    </span>
  )
}
