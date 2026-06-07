const SITEMAP_URL = 'https://theforestry.me/sitemap.xml'

/**
 * Ping Google and Bing to notify them the sitemap has changed.
 * Fire-and-forget — never throws, never blocks the response.
 */
export function pingSitemapIndexers(): void {
  const endpoints = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ]

  for (const url of endpoints) {
    fetch(url, { method: 'GET' }).catch(() => {
      // Silently ignore — ping is best-effort
    })
  }
}
