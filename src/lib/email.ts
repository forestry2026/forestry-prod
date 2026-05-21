import { getEmailConfig } from '@/lib/emailConfig'
import { buildEmail }     from '@/lib/emailTemplates/engine'

const APP = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/* ────────────────────────────────────────────────────────────────────
 * All functions below now resolve their HTML + subject through the
 * template engine. Defaults live in src/lib/emailTemplates/defaults.ts.
 * Admin can override via the Settings → Email Templates UI (DB row).
 * ──────────────────────────────────────────────────────────────────── */

export async function sendAccessRequestReceived(to: string, name: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('access.received', { name, appUrl: APP })
  return resend.emails.send({ from, to, subject, html })
}

export async function sendAccessApproved(to: string, name: string, password: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('access.approved', { name, email: to, password, appUrl: APP })
  return resend.emails.send({ from, to, subject, html })
}

export async function sendAccessRejected(to: string, name: string, reason?: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('access.rejected', { name, reason: reason || 'Your application did not meet our current vendor criteria.' })
  return resend.emails.send({ from, to, subject, html })
}

export async function sendAccessRevoked(to: string, name: string, reason?: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('access.revoked', { name, reason: reason || 'Access has been revoked by an administrator.' })
  return resend.emails.send({ from, to, subject, html })
}

export async function sendNewRfpNotification(rfpNumber: string, vendorName: string, projectName?: string) {
  const { resend, from, adminEmail } = await getEmailConfig()
  if (!adminEmail) return
  const { subject, html } = await buildEmail('rfp.created', { rfpNumber, vendorName, projectName: projectName || '—', appUrl: APP })
  return resend.emails.send({ from, to: adminEmail, subject, html })
}

export async function sendRfpWithdrawnNotification(rfpNumber: string, vendorName: string, projectName?: string) {
  const { resend, from, adminEmail } = await getEmailConfig()
  if (!adminEmail) return
  const { subject, html } = await buildEmail('rfp.withdrawn', { rfpNumber, vendorName, projectName: projectName || '—' })
  return resend.emails.send({ from, to: adminEmail, subject, html })
}

export async function sendQuoteSent(
  to:         string,
  name:       string,
  rfpNumber:  string,
  rfpId:      string,
  total:      number,
  validUntil: Date | string,
  pdfAttachment?: { filename: string; content: Buffer } | null,
) {
  const { resend, from } = await getEmailConfig()
  const totalStr     = `AED ${total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  const validStr     = new Date(validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const { subject, html } = await buildEmail('rfp.quoteSent', {
    name, rfpNumber, total: totalStr, validUntil: validStr,
    rfpUrl: `${APP}/portal/rfp/${rfpId}`,
  })
  return resend.emails.send({
    from, to, subject, html,
    attachments: pdfAttachment ? [{ filename: pdfAttachment.filename, content: pdfAttachment.content }] : undefined,
  })
}

export async function sendPasswordReset(to: string, name: string, newPassword: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('account.passwordReset', { name, password: newPassword, appUrl: APP })
  return resend.emails.send({ from, to, subject, html })
}
