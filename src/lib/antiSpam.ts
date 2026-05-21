/**
 * Lightweight anti-spam helpers for public form submissions.
 *
 * Two layers:
 *   1. Honeypot — a hidden form field bots fill but humans never see.
 *      If the field is non-empty, treat the submission as a bot.
 *   2. Disposable email block — small static list of throwaway providers.
 *      Keeps DB clean from obvious garbage signups.
 */

/** Honeypot field name used across forms. Must match between client + server. */
export const HONEYPOT_FIELD = 'website_url'

/** Returns true if the honeypot value is filled (i.e., a bot likely submitted). */
export function honeypotTriggered(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return value.trim().length > 0
}

const DISPOSABLE_DOMAINS = new Set([
  // Common disposable / temporary mail providers
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  '10minutemail.com',
  '10minutemail.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'throwaway.email',
  'sharklasers.com',
  'trashmail.com',
  'trashmail.net',
  'fakeinbox.com',
  'maildrop.cc',
  'getairmail.com',
  'mintemail.com',
  'tempinbox.com',
  'mailcatch.com',
  'spamgourmet.com',
  'mohmal.com',
  'getnada.com',
  'mvrht.net',
  'mvrht.com',
  'dispostable.com',
  'mytrashmail.com',
  'mailnesia.com',
  'mt2014.com',
  'mt2015.com',
  'mailbox.in.ua',
  'mailfa.tk',
  'sogetthis.com',
])

/**
 * Returns true if the email's domain is on the disposable-provider block list.
 * Safe with malformed strings — returns false rather than throwing.
 */
export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false
  const at = email.lastIndexOf('@')
  if (at === -1 || at === email.length - 1) return false
  const domain = email.slice(at + 1).toLowerCase().trim()
  return DISPOSABLE_DOMAINS.has(domain)
}
