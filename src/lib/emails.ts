/**
 * Email notifications using Resend (production + quotation flows)
 */

import { getEmailConfig } from '@/lib/emailConfig'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendQuotationEmail(
  vendorEmail:  string,
  companyName:  string,
  quotation:    any,
  quotationUrl: string,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: vendorEmail,
    subject: 'New Quotation Ready for Review',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>A new quotation has been prepared for your review.</p>
      <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Quotation Details:</strong></p>
        <ul>
          <li>Total Amount: AED ${quotation.total.toFixed(2)}</li>
          <li>Valid Until: ${new Date(quotation.validUntil).toLocaleDateString()}</li>
          <li>Items: ${quotation.items?.length || 0}</li>
        </ul>
      </div>
      <p>
        <a href="${quotationUrl}" style="display:inline-block;background:#B35C2A;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Review Quotation
        </a>
      </p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendQuotationApprovedEmail(
  email:       string,
  companyName: string,
  quotationId: string,
  amount:      number,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Quotation Approved - ${companyName}`,
    html: `
      <h2>Quotation Approved!</h2>
      <p>The quotation for ${companyName} has been approved.</p>
      <div style="background:#dcfce7;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Amount: AED ${amount.toFixed(2)}</strong></p>
        <p>Quotation ID: ${quotationId}</p>
      </div>
      <p>The order has moved to production queue.</p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendQuotationDeclinedEmail(
  email:       string,
  companyName: string,
  quotationId: string,
  reason?:     string,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Quotation Declined - ${companyName}`,
    html: `
      <h2>Quotation Declined</h2>
      <p>The quotation for ${companyName} has been declined.</p>
      <div style="background:#fee2e2;padding:20px;border-radius:8px;margin:20px 0;">
        <p>Quotation ID: ${quotationId}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p>Please follow up with the vendor.</p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendQuotationRevisionEmail(
  email:       string,
  companyName: string,
  quotationId: string,
  notes?:      string,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Quotation Revision Requested - ${companyName}`,
    html: `
      <h2>Quotation Revision Requested</h2>
      <p>${companyName} has requested revisions to their quotation.</p>
      <div style="background:#fef3c7;padding:20px;border-radius:8px;margin:20px 0;">
        <p>Quotation ID: ${quotationId}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
      <p>Please review and update the quotation.</p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendProductionApprovedEmail(
  email:               string,
  companyName:         string,
  orderNumber:         string,
  estimatedCompletion: Date,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Production Approved - Order ${orderNumber}`,
    html: `
      <h2>Production Approved!</h2>
      <p>Hello ${companyName},</p>
      <p>Your order has been approved and moved into production.</p>
      <div style="background:#dcfce7;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Estimated Completion:</strong> ${new Date(estimatedCompletion).toLocaleDateString()}</p>
      </div>
      <p>
        <a href="${APP_URL}/portal/orders/${orderNumber}" style="display:inline-block;background:#B35C2A;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Track Order
        </a>
      </p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendProductionStartedEmail(
  email:               string,
  companyName:         string,
  orderNumber:         string,
  estimatedCompletion: Date,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Production Started - Order ${orderNumber}`,
    html: `
      <h2>Production Started!</h2>
      <p>Hello ${companyName},</p>
      <p>Your order has started production.</p>
      <div style="background:#dbeafe;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Estimated Completion:</strong> ${new Date(estimatedCompletion).toLocaleDateString()}</p>
      </div>
      <p>
        <a href="${APP_URL}/portal/orders/${orderNumber}" style="display:inline-block;background:#B35C2A;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          Track Order
        </a>
      </p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendProductionUpdateEmail(
  email:       string,
  companyName: string,
  orderNumber: string,
  stage:       string,
  notes?:      string,
) {
  const stageNames: Record<string, string> = {
    MOLDING: 'Molding', DRYING: 'Drying', FINISHING: 'Finishing',
    GLAZING: 'Glazing', QUALITY_CHECK: 'Quality Check',
    PACKAGING: 'Packaging', READY: 'Ready for Delivery',
  }
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Production Update - Order ${orderNumber}`,
    html: `
      <h2>Production Update</h2>
      <p>Hello ${companyName},</p>
      <p>Your order has progressed to the <strong>${stageNames[stage] || stage}</strong> stage.</p>
      <div style="background:#dbeafe;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Current Stage:</strong> ${stageNames[stage] || stage}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>
      <p>
        <a href="${APP_URL}/portal/orders/${orderNumber}" style="display:inline-block;background:#B35C2A;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          View Full Details
        </a>
      </p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}

export async function sendProductionCompleteEmail(
  email:          string,
  companyName:    string,
  orderNumber:    string,
  completionDate: Date,
) {
  const { resend, from } = await getEmailConfig()
  await resend.emails.send({
    from, to: email,
    subject: `Order Complete - ${orderNumber}`,
    html: `
      <h2>Your Order is Ready!</h2>
      <p>Hello ${companyName},</p>
      <p>Your order has been completed and is ready for delivery.</p>
      <div style="background:#dcfce7;padding:20px;border-radius:8px;margin:20px 0;">
        <p><strong>Order Number:</strong> ${orderNumber}</p>
        <p><strong>Completed Date:</strong> ${new Date(completionDate).toLocaleDateString()}</p>
      </div>
      <p>
        <a href="${APP_URL}/portal/orders/${orderNumber}" style="display:inline-block;background:#B35C2A;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">
          View Order Details
        </a>
      </p>
      <p>Best regards,<br>Forestry Team</p>
    `,
  })
}
