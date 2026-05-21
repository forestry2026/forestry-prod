/**
 * Template registry — single source of truth for every transactional email.
 * Adding a new email means adding an entry here + a default in `defaults.ts`.
 */

export type TemplateKey =
  // Access / onboarding
  | 'access.received'
  | 'access.approved'
  | 'access.rejected'
  | 'access.revoked'
  // RFP
  | 'rfp.created'        // admin notified of new RFP
  | 'rfp.withdrawn'      // admin notified of withdrawn RFP
  | 'rfp.quoteSent'      // vendor — quote ready, PDF attached
  // Quotation lifecycle
  | 'quote.approved'     // admin notified vendor accepted
  | 'quote.declined'     // admin notified vendor declined
  | 'quote.revisionRequest' // admin notified vendor requested revision
  // Production lifecycle
  | 'production.approved'
  | 'production.started'
  | 'production.update'
  | 'production.complete'
  // Account
  | 'account.passwordReset'

export interface TemplateMeta {
  key:         TemplateKey
  /** Human-readable label shown in the admin UI. */
  label:       string
  /** When this template fires + who receives it. */
  description: string
  /** Recipient role (informational, not enforced). */
  recipient:   'Vendor' | 'Admin' | 'User'
  /** Variables available — shown in the editor as hints. */
  variables:   Array<{ token: string; example: string }>
}

export interface TemplateBody {
  subject: string  // may contain {{tokens}}
  html:    string  // raw HTML, may contain {{tokens}}
}

export const REGISTRY: TemplateMeta[] = [
  {
    key: 'access.received',
    label: 'Access Request Received',
    description: 'Sent to a vendor right after they submit /request-access. Confirms receipt.',
    recipient: 'Vendor',
    variables: [
      { token: '{{name}}',    example: 'Sarah Chen'           },
      { token: '{{appUrl}}',  example: 'https://forestry.ae'  },
    ],
  },
  {
    key: 'access.approved',
    label: 'Access Approved (Welcome)',
    description: 'Sent when admin approves an access request. Includes temp password.',
    recipient: 'Vendor',
    variables: [
      { token: '{{name}}',     example: 'Sarah Chen' },
      { token: '{{email}}',    example: 'sarah@acme.com' },
      { token: '{{password}}', example: 'TempPass123!' },
      { token: '{{appUrl}}',   example: 'https://forestry.ae' },
    ],
  },
  {
    key: 'access.rejected',
    label: 'Access Rejected',
    description: 'Sent when admin rejects an access request.',
    recipient: 'Vendor',
    variables: [
      { token: '{{name}}',   example: 'Sarah Chen' },
      { token: '{{reason}}', example: 'Trade licence could not be verified.' },
    ],
  },
  {
    key: 'access.revoked',
    label: 'Access Revoked',
    description: 'Sent when admin revokes an existing vendor account.',
    recipient: 'Vendor',
    variables: [
      { token: '{{name}}',   example: 'Sarah Chen' },
      { token: '{{reason}}', example: 'Repeated late payments.' },
    ],
  },
  {
    key: 'rfp.created',
    label: 'New RFP Notification (Admin)',
    description: 'Sent to admin inbox when a vendor submits a new RFP.',
    recipient: 'Admin',
    variables: [
      { token: '{{rfpNumber}}',   example: 'RFP-2026-0012' },
      { token: '{{vendorName}}',  example: 'Sarah Chen'    },
      { token: '{{projectName}}', example: 'Marina Project'},
      { token: '{{appUrl}}',      example: 'https://forestry.ae' },
    ],
  },
  {
    key: 'rfp.withdrawn',
    label: 'RFP Withdrawn (Admin)',
    description: 'Sent to admin when a vendor withdraws an RFP.',
    recipient: 'Admin',
    variables: [
      { token: '{{rfpNumber}}',   example: 'RFP-2026-0012' },
      { token: '{{vendorName}}',  example: 'Sarah Chen'    },
      { token: '{{projectName}}', example: 'Marina Project'},
    ],
  },
  {
    key: 'rfp.quoteSent',
    label: 'Quotation Ready (Vendor)',
    description: 'Sent to vendor when admin clicks "Send Quotation". PDF attached.',
    recipient: 'Vendor',
    variables: [
      { token: '{{name}}',       example: 'Sarah Chen' },
      { token: '{{rfpNumber}}',  example: 'RFP-2026-0012' },
      { token: '{{total}}',      example: 'AED 12,999.94' },
      { token: '{{validUntil}}', example: '21 May 2026' },
      { token: '{{rfpUrl}}',     example: 'https://forestry.ae/portal/rfp/abc' },
    ],
  },
  {
    key: 'quote.approved',
    label: 'Quote Approved (Admin)',
    description: 'Sent to admin when a vendor approves a quotation.',
    recipient: 'Admin',
    variables: [
      { token: '{{vendorName}}',    example: 'Acme Co' },
      { token: '{{quotationId}}',   example: 'QT-0042' },
      { token: '{{total}}',         example: 'AED 12,999.94' },
    ],
  },
  {
    key: 'quote.declined',
    label: 'Quote Declined (Admin)',
    description: 'Sent to admin when a vendor declines a quotation.',
    recipient: 'Admin',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co' },
      { token: '{{quotationId}}', example: 'QT-0042' },
      { token: '{{notes}}',       example: 'Price too high.' },
    ],
  },
  {
    key: 'quote.revisionRequest',
    label: 'Quote Revision Requested (Admin)',
    description: 'Sent to admin when a vendor requests changes to a quotation.',
    recipient: 'Admin',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co' },
      { token: '{{quotationId}}', example: 'QT-0042' },
      { token: '{{notes}}',       example: 'Reduce quantity to 50.' },
    ],
  },
  {
    key: 'production.approved',
    label: 'Production Approved (Vendor)',
    description: 'Sent to vendor when manager approves an order for production.',
    recipient: 'Vendor',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co' },
      { token: '{{orderNumber}}', example: 'PO-0042' },
    ],
  },
  {
    key: 'production.started',
    label: 'Production Started (Vendor)',
    description: 'Sent to vendor when production work begins.',
    recipient: 'Vendor',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co' },
      { token: '{{orderNumber}}', example: 'PO-0042' },
    ],
  },
  {
    key: 'production.update',
    label: 'Production Update (Vendor)',
    description: 'Sent to vendor whenever the order moves to a new production stage.',
    recipient: 'Vendor',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co'        },
      { token: '{{orderNumber}}', example: 'PO-0042'        },
      { token: '{{stage}}',       example: 'MOULDING'       },
      { token: '{{notes}}',       example: 'On schedule.'   },
    ],
  },
  {
    key: 'production.complete',
    label: 'Production Complete (Vendor)',
    description: 'Sent to vendor when production is finished and ready to dispatch.',
    recipient: 'Vendor',
    variables: [
      { token: '{{vendorName}}',  example: 'Acme Co' },
      { token: '{{orderNumber}}', example: 'PO-0042' },
    ],
  },
  {
    key: 'account.passwordReset',
    label: 'Password Reset (User)',
    description: 'Sent when an admin resets a user password and chooses "send email".',
    recipient: 'User',
    variables: [
      { token: '{{name}}',     example: 'Sarah Chen' },
      { token: '{{password}}', example: 'TempPass123!' },
      { token: '{{appUrl}}',   example: 'https://forestry.ae' },
    ],
  },
]
