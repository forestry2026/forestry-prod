/**
 * Default email templates — used when no admin-edited DB override exists.
 * Subject + body wrapped by the shared layout shell. {{tokens}} get
 * substituted at send time.
 */

import { emailLayout, ctaButton, callout } from './layout'
import type { TemplateBody, TemplateKey }  from './types'

export const DEFAULTS: Record<TemplateKey, TemplateBody> = {

  /* ── Access / onboarding ─────────────────────────────────────── */
  'access.received': {
    subject: 'We received your access request — Forestry',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>Thanks for requesting access to the Forestry vendor portal.</p>
      <p>Our team is reviewing your details. You'll hear from us within 24–48 hours.</p>
      <p style="color:#8C8378;font-size:13px;margin-top:24px;">No action needed from your side right now.</p>
    `),
  },

  'access.approved': {
    subject: 'Welcome to Forestry — your account is active',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>Your Forestry vendor account is approved and ready.</p>
      ${callout('Sign in email', '{{email}}')}
      ${callout('Temporary password', '{{password}}', true)}
      <p style="font-size:13px;color:#8C8378;">Change this password after your first login.</p>
      ${ctaButton('{{appUrl}}/login', 'Sign in to Forestry')}
      <p>If anything is unclear, reply to this email.</p>
    `),
  },

  'access.rejected': {
    subject: 'Forestry access request — declined',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>We're unable to approve your access request at this time.</p>
      <div style="margin:18px 0;padding:14px 18px;background:#FBEEEA;border-left:3px solid #C96B4A;border-radius:6px;font-size:13.5px;">
        <strong style="display:block;margin-bottom:4px;">Reason</strong>
        {{reason}}
      </div>
      <p>You're welcome to apply again with updated information.</p>
    `),
  },

  'access.revoked': {
    subject: 'Forestry account access — revoked',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>Your access to the Forestry vendor portal has been revoked.</p>
      <div style="margin:18px 0;padding:14px 18px;background:#FBEEEA;border-left:3px solid #C96B4A;border-radius:6px;font-size:13.5px;">
        <strong style="display:block;margin-bottom:4px;">Reason</strong>
        {{reason}}
      </div>
      <p>If you believe this is an error, reply to this email.</p>
    `),
  },

  /* ── RFP lifecycle ───────────────────────────────────────────── */
  'rfp.created': {
    subject: 'New RFP {{rfpNumber}} from {{vendorName}}',
    html: emailLayout(`
      <h2 style="margin:0 0 14px;font-size:16px;color:#2D2926;letter-spacing:-0.005em;">New RFP submitted</h2>
      ${callout('RFP number', '{{rfpNumber}}', true)}
      <p><strong>From</strong>: {{vendorName}}<br/>
         <strong>Project</strong>: {{projectName}}</p>
      ${ctaButton('{{appUrl}}/admin/rfps', 'Review RFP')}
    `),
  },

  'rfp.withdrawn': {
    subject: 'RFP {{rfpNumber}} withdrawn by {{vendorName}}',
    html: emailLayout(`
      <h2 style="margin:0 0 14px;font-size:16px;color:#2D2926;letter-spacing:-0.005em;">RFP withdrawn</h2>
      <p>{{vendorName}} has withdrawn an RFP.</p>
      ${callout('RFP number', '{{rfpNumber}}', true)}
      <p style="color:#8C8378;">Project: {{projectName}}</p>
    `),
  },

  'rfp.quoteSent': {
    subject: 'Your quotation for {{rfpNumber}} is ready — {{total}}',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>Your quotation for <strong>{{rfpNumber}}</strong> is ready to review. The full PDF is attached to this email.</p>
      ${callout('Total amount', '{{total}}')}
      ${callout('Valid until', '{{validUntil}}')}
      ${ctaButton('{{rfpUrl}}', 'View & accept quotation')}
      <p style="font-size:13px;color:#8C8378;">Questions? Reply to this email.</p>
    `),
  },

  /* ── Quotation lifecycle ─────────────────────────────────────── */
  'quote.approved': {
    subject: 'Quotation {{quotationId}} approved by {{vendorName}}',
    html: emailLayout(`
      <h2 style="margin:0 0 14px;font-size:16px;color:#2D2926;letter-spacing:-0.005em;">Quotation approved</h2>
      <p>{{vendorName}} has accepted the quotation.</p>
      ${callout('Quotation', '{{quotationId}}', true)}
      ${callout('Total', '{{total}}')}
      <p>You can now move this order into production.</p>
    `),
  },

  'quote.declined': {
    subject: 'Quotation {{quotationId}} declined by {{vendorName}}',
    html: emailLayout(`
      <h2 style="margin:0 0 14px;font-size:16px;color:#2D2926;letter-spacing:-0.005em;">Quotation declined</h2>
      <p>{{vendorName}} has declined the quotation.</p>
      ${callout('Quotation', '{{quotationId}}', true)}
      <div style="margin:18px 0;padding:14px 18px;background:#FAF7F2;border-left:3px solid #C96B4A;border-radius:6px;font-size:13.5px;">
        <strong style="display:block;margin-bottom:4px;">Notes</strong>
        {{notes}}
      </div>
    `),
  },

  'quote.revisionRequest': {
    subject: 'Quotation {{quotationId}} — revision requested',
    html: emailLayout(`
      <h2 style="margin:0 0 14px;font-size:16px;color:#2D2926;letter-spacing:-0.005em;">Revision requested</h2>
      <p>{{vendorName}} has requested changes to the quotation.</p>
      ${callout('Quotation', '{{quotationId}}', true)}
      <div style="margin:18px 0;padding:14px 18px;background:#FAF7F2;border-left:3px solid #C96B4A;border-radius:6px;font-size:13.5px;">
        <strong style="display:block;margin-bottom:4px;">Requested changes</strong>
        {{notes}}
      </div>
    `),
  },

  /* ── Production lifecycle ────────────────────────────────────── */
  'production.approved': {
    subject: 'Order {{orderNumber}} approved for production',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{vendorName}},</p>
      <p>Your order has been approved for production. We'll begin shortly.</p>
      ${callout('Order', '{{orderNumber}}', true)}
    `),
  },

  'production.started': {
    subject: 'Production has started — Order {{orderNumber}}',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{vendorName}},</p>
      <p>Production has begun on your order.</p>
      ${callout('Order', '{{orderNumber}}', true)}
      <p style="color:#8C8378;font-size:13px;">You'll receive updates as the order moves through each stage.</p>
    `),
  },

  'production.update': {
    subject: 'Production update — Order {{orderNumber}} → {{stage}}',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{vendorName}},</p>
      <p>Your order has moved to a new production stage.</p>
      ${callout('Order', '{{orderNumber}}', true)}
      ${callout('Current stage', '{{stage}}')}
      <div style="margin:18px 0;padding:14px 18px;background:#FAF7F2;border-left:3px solid #C96B4A;border-radius:6px;font-size:13.5px;">
        <strong style="display:block;margin-bottom:4px;">Notes</strong>
        {{notes}}
      </div>
    `),
  },

  'production.complete': {
    subject: 'Order {{orderNumber}} — production complete',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{vendorName}},</p>
      <p>Production is complete on your order. Ready to dispatch.</p>
      ${callout('Order', '{{orderNumber}}', true)}
      <p>Our team will be in touch about delivery shortly.</p>
    `),
  },

  /* ── Account ─────────────────────────────────────────────────── */
  'account.passwordReset': {
    subject: 'Your Forestry password has been reset',
    html: emailLayout(`
      <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#2D2926;">Hello {{name}},</p>
      <p>An admin has reset your password. Use this temporary password to sign in:</p>
      ${callout('Temporary password', '{{password}}', true)}
      <p style="font-size:13px;color:#8C8378;">For security, change it immediately after signing in.</p>
      ${ctaButton('{{appUrl}}/login', 'Sign in')}
    `),
  },
}
