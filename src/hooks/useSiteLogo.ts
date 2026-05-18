'use client'

import { useState, useEffect } from 'react'

/**
 * Fetches and caches the site logo URL from brand settings.
 * Automatically updates when the logo changes via the 'logo-updated' event.
 * Adds a cache-busting timestamp query parameter to ensure the latest logo is displayed.
 *
 * The hook initializes the logo URL by fetching from '/api/admin/settings/brand' and listens
 * for 'logo-updated' custom events (dispatched when admin updates branding). Returns null
 * if the logo is not configured or the fetch fails.
 *
 * @returns The site logo URL string with cache-busting timestamp query, or null if not available
 *
 * @example
 * export function Header() {
 *   const logoUrl = useSiteLogo()
 *   return logoUrl ? <img src={logoUrl} alt="Site Logo" /> : null
 * }
 *
 * @remarks
 * - The timestamp (?t=) prevents browser caching issues when logo is updated
 * - Custom 'logo-updated' event listener enables real-time UI updates without page reload
 * - Automatically unsubscribes from event listener on unmount
 * - Silently catches fetch errors and returns null
 */
export function useSiteLogo(): string | null {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    // Fetch initial logo from brand settings endpoint
    fetch('/api/admin/settings/brand')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl + '?t=' + Date.now()) })
      .catch(() => {})

    // Listen for logo updates triggered from admin panel
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.logoUrl
      setLogoUrl(url ? url + '?t=' + Date.now() : null)
    }
    window.addEventListener('logo-updated', handler)
    return () => window.removeEventListener('logo-updated', handler)
  }, [])

  return logoUrl
}
