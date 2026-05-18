'use client'

import { useEffect } from 'react'

/**
 * Forces the page to start at the top on initial mount.
 *
 * Why this is needed:
 *   - Browsers + Next.js try to restore the scroll position from the previous
 *     session. On the landing page, this is often wrong — visitors expect to
 *     see the hero, not wherever they left off.
 *   - Only resets when there's no URL hash, so `/#collection` etc. still work.
 *   - Uses `scrollRestoration = 'manual'` to disable the browser's automatic
 *     restoration for this entry, preventing the brief jump-then-snap-back
 *     flash.
 */
export function ScrollResetOnLoad() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash) return // honour anchor links like #collection
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch { /* ignore */ }
    // Run after paint so we override any restoration that already happened.
    requestAnimationFrame(() => window.scrollTo(0, 0))
  }, [])

  return null
}
