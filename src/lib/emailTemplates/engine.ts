/**
 * Email template engine.
 *
 *   1. Load template body for a key — DB override if exists, else file default.
 *   2. Substitute {{tokens}} with passed variables.
 *   3. Return { subject, html } ready for Resend.
 *
 * Used by both runtime send code and the admin preview UI.
 */

import { prisma }     from '@/lib/prisma'
import { DEFAULTS }   from './defaults'
import { brandHeaderHtml } from './layout'
import type { TemplateBody, TemplateKey } from './types'

/* In-process cache so the DB isn't hit on every send within the same lambda. */
const cache = new Map<TemplateKey, { body: TemplateBody; fetchedAt: number }>()
const TTL_MS = 60_000

/* Brand logo cache — separate from template cache so admins can change logo independently. */
let logoCache: { url: string | null; fetchedAt: number } | null = null
const LOGO_TTL_MS = 60_000

export function clearTemplateCache(key?: TemplateKey) {
  if (key) cache.delete(key)
  else cache.clear()
}

export function clearLogoCache() {
  logoCache = null
}

/** Fetch the admin-uploaded brand logo URL from SiteSetting (cached). */
async function getBrandLogoUrl(): Promise<string | null> {
  if (logoCache && Date.now() - logoCache.fetchedAt < LOGO_TTL_MS) return logoCache.url
  let url: string | null = null
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
    url = row?.value ?? null
  } catch { /* fall through */ }
  logoCache = { url, fetchedAt: Date.now() }
  return url
}

/** Resolve the live template body (DB override if present, otherwise file default). */
export async function resolveTemplate(key: TemplateKey): Promise<TemplateBody> {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) return cached.body

  let body: TemplateBody = DEFAULTS[key]
  try {
    const row = await prisma.emailTemplate.findUnique({ where: { key } })
    if (row?.subject && row?.html) body = { subject: row.subject, html: row.html }
  } catch (err) {
    console.warn('[emailTemplates] DB lookup failed for', key, '— using default. Error:', err)
  }

  cache.set(key, { body, fetchedAt: Date.now() })
  return body
}

/**
 * Variable substitution. Replaces every `{{token}}` with `vars[token]`.
 * Missing tokens render as empty strings so a typo doesn't leak `{{name}}` to recipients.
 */
export function renderTemplate(body: TemplateBody, vars: Record<string, string | number | null | undefined>): TemplateBody {
  const replace = (s: string) =>
    s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, token: string) => {
      const v = vars[token]
      return v == null ? '' : String(v)
    })

  return {
    subject: replace(body.subject),
    html:    replace(body.html),
  }
}

/** Convenience — resolve + render + inject brand logo in one call. */
export async function buildEmail(
  key: TemplateKey,
  vars: Record<string, string | number | null | undefined>,
): Promise<TemplateBody> {
  const [body, logoUrl] = await Promise.all([resolveTemplate(key), getBrandLogoUrl()])
  const rendered = renderTemplate(body, vars)
  // Replace the brand header sentinel with the live logo (or fallback wordmark).
  rendered.html = rendered.html.replace(/<!--BRAND_HEADER-->/g, brandHeaderHtml(logoUrl))
  return rendered
}
