'use client'

import { useEffect } from 'react'

/**
 * Landing-page scroll behaviour controller:
 *   - On first mount with no hash → force top.
 *   - On mount WITH a hash (e.g. /#collection) → scroll to that element.
 *   - On hash change (clicking View Collection etc.) → scroll to target.
 *
 * Sets `history.scrollRestoration = 'manual'` so the browser doesn't
 * auto-restore an old scroll position on refresh. Because that disables
 * browser-native scroll-on-hash, we re-implement the hash scroll here.
 */
export function ScrollResetOnLoad() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch { /* ignore */ }

    function scrollToHash(hash: string) {
      const id = hash.replace(/^#/, '')
      if (!id) return false
      const el = document.getElementById(id)
      if (!el) return false
      // Wait one frame so layout settles, then smooth-scroll.
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      return true
    }

    // Initial load
    if (window.location.hash) {
      // Defer slightly so server-rendered content (images, etc.) mount first.
      requestAnimationFrame(() => scrollToHash(window.location.hash))
    } else {
      requestAnimationFrame(() => window.scrollTo(0, 0))
    }

    // Subsequent clicks on in-page anchors
    function onHashChange() { scrollToHash(window.location.hash) }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return null
}
