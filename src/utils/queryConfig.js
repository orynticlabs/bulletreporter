/**
 * Shared React Query timing constants.
 *
 * CONTENT_REFETCH_INTERVAL  – how often live content queries re-fetch (2 min).
 * CONTENT_STALE_TIME        – how long before content is considered stale (30 s).
 *                             Must be shorter than the refetch interval so the
 *                             interval actually sends a new request.
 * STATIC_STALE_TIME         – for slow-changing data (categories, settings, etc.).
 * ARTICLE_STALE_TIME        – for individual article detail pages (5 min).
 */
export const CONTENT_REFETCH_INTERVAL   = 2 * 60 * 1000   // 2 minutes
export const CONTENT_STALE_TIME         = 30 * 1000        // 30 seconds
export const STATIC_STALE_TIME          = 10 * 60 * 1000   // 10 minutes
export const ARTICLE_STALE_TIME         = 5 * 60 * 1000    // 5 minutes
export const PUBLIC_CACHE_CHECK_INTERVAL = 2 * 60 * 1000   // 2 minutes
