/**
 * Email notifications for production + quotation flows.
 * All bodies + subjects come from the central template engine.
 * Admin can edit copy via Settings → Email Templates (DB overrides default).
 */

import { getEmailConfig } from '@/lib/emailConfig'
import { buildEmail }     from '@/lib/emailTemplates/engine'

const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/* ── Quotation: initial send ─────────────────────────────────────────
   Legacy quotation flow — used by /api/quotations/[id]/send.
   Mirrors rfp.quoteSent template for consistency. */
export async function sendQuotationEmail(
  vendorEmail:  string,
  companyName:  string,
  quotation:    { id: string; total: number | string; validUntil?: Date | string | null },
  quotationUrl: string,
) {
  const { resend, from } = await getEmailConfig()
  const totalNum = typeof quotation.total === 'string' ? parseFloat(quotation.total) : quotation.total
  const totalStr = `AED ${Number(totalNum || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  const validStr = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  // Reuses the same rfp.quoteSent template (companyName goes into the {{name}} slot).
  const { subject, html } = await buildEmail('rfp.quoteSent', {
    name:       companyName,
    rfpNumber:  quotation.id,
    total:      totalStr,
    validUntil: validStr,
    rfpUrl:     quotationUrl || `${APP_URL}/portal`,
  })
  return resend.emails.send({ from, to: vendorEmail, subject, html })
}

/* ── Quotation lifecycle (admin notifications) ──────────────────── */
export async function sendQuotationApprovedEmail(adminEmail: string, vendorName: string, quotationId: string, total: number | string) {
  const { resend, from } = await getEmailConfig()
  const totalStr = `AED ${Number(total || 0).toLocaleString('en-AE', { minimumFractionDigits: 2 })}`
  const { subject, html } = await buildEmail('quote.approved', { vendorName, quotationId, total: totalStr })
  return resend.emails.send({ from, to: adminEmail, subject, html })
}

export async function sendQuotationDeclinedEmail(adminEmail: string, vendorName: string, quotationId: string, notes?: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('quote.declined', { vendorName, quotationId, notes: notes || '—' })
  return resend.emails.send({ from, to: adminEmail, subject, html })
}

export async function sendQuotationRevisionEmail(adminEmail: string, vendorName: string, quotationId: string, notes?: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('quote.revisionRequest', { vendorName, quotationId, notes: notes || '—' })
  return resend.emails.send({ from, to: adminEmail, subject, html })
}

/* ── Production lifecycle (vendor notifications) ─────────────────── */
export async function sendProductionApprovedEmail(vendorEmail: string, vendorName: string, orderNumber: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('production.approved', { vendorName, orderNumber })
  return resend.emails.send({ from, to: vendorEmail, subject, html })
}

export async function sendProductionStartedEmail(vendorEmail: string, vendorName: string, orderNumber: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('production.started', { vendorName, orderNumber })
  return resend.emails.send({ from, to: vendorEmail, subject, html })
}

export async function sendProductionUpdateEmail(vendorEmail: string, vendorName: string, orderNumber: string, stage: string, notes?: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('production.update', { vendorName, orderNumber, stage, notes: notes || '—' })
  return resend.emails.send({ from, to: vendorEmail, subject, html })
}

export async function sendProductionCompleteEmail(vendorEmail: string, vendorName: string, orderNumber: string) {
  const { resend, from } = await getEmailConfig()
  const { subject, html } = await buildEmail('production.complete', { vendorName, orderNumber })
  return resend.emails.send({ from, to: vendorEmail, subject, html })
}
