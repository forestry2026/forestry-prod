/**
 * Central email config — reads from SiteSetting DB first, falls back to env vars.
 * Both email.ts and emails.ts use this so a single save in the admin panel
 * affects every outbound email in the system.
 */

import { Resend } from 'resend'
import { prisma }  from '@/lib/prisma'

export interface EmailConfig {
  resend:     Resend
  from:       string
  adminEmail: string
}

// In-process cache so we don't hit DB on every send within the same request
let _cache: EmailConfig | null = null
let _cacheAt = 0
const CACHE_TTL_MS = 60_000 // 1 minute

export async function getEmailConfig(): Promise<EmailConfig> {
  if (_cache && Date.now() - _cacheAt < CACHE_TTL_MS) return _cache

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['email_resend_api_key', 'email_from', 'admin_email'] } },
  })

  const db = Object.fromEntries(rows.map(r => [r.key, r.value]))

  const apiKey    = db['email_resend_api_key'] || process.env.RESEND_API_KEY || ''
  const from      = db['email_from']           || process.env.EMAIL_FROM     || 'Forestry <noreply@forestry.ae>'
  const adminEmail = db['admin_email']         || process.env.ADMIN_EMAIL    || 'admin@forestry.ae'

  _cache   = { resend: new Resend(apiKey), from, adminEmail }
  _cacheAt = Date.now()
  return _cache
}

/** Call after saving new settings so next send picks up fresh values */
export function invalidateEmailConfigCache() {
  _cache   = null
  _cacheAt = 0
}
