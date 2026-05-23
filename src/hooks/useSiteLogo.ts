'use client'

import { useState, useEffect } from 'react'

/**
 * Site-wide logo URL hook.
 *
 * Resolution order:
 *  1. `initial` argument (server-passed prop) — preferred.
 *  2. `<html data-site-logo-url="…">` (set by the root layout on every SSR).
 *  3. Client-side fetch to /api/admin/settings/brand (fallback only).
 *
 * Steps 1 + 2 eliminate the "FORESTRY text fallback flash" on first paint
 * that used to appear because the hook started with `null` until the
 * client fetch resolved.
 *
 * Also listens for the `logo-updated` window event so the admin's "Save
 * brand logo" action propagates without a page refresh.
 */
function readDomLogo(): string | null {
  if (typeof document === 'undefined') return null
  const el = document.documentElement
  const v = el.dataset.siteLogoUrl
  return v && v.length > 0 ? v : null
}

export function useSiteLogo(initial: string | null = null): string | null {
  // useState initializer runs once: try server prop, then DOM dataset.
  // Both are available during SSR/hydration, so the rendered HTML contains
  // the real <img> immediately — no fallback text flash.
  const [logoUrl, setLogoUrl] = useState<string | null>(() => initial ?? readDomLogo())

  useEffect(() => {
    const haveInitial = (initial ?? readDomLogo()) != null

    if (!haveInitial) {
      // No server-provided URL — fall back to a client fetch.
      fetch('/api/admin/settings/brand')
        .then(r => r.json())
        .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl + '?t=' + Date.now()) })
        .catch(() => {})
    }

    // Live updates from the admin panel.
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.logoUrl
      setLogoUrl(url ? url + '?t=' + Date.now() : null)
    }
    window.addEventListener('logo-updated', handler)
    return () => window.removeEventListener('logo-updated', handler)
  }, [initial])

  return logoUrl
}
