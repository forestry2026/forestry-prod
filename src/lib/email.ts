import { getEmailConfig } from '@/lib/emailConfig'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ── Access Request Received ──────────────────────────────────────
export async function sendAccessRequestReceived(to: string, name: string) {
  const { resend, from } = await getEmailConfig()
  return resend.emails.send({
    from, to,
    subject: 'We received your Forestry vendor access request',
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for requesting access to the Forestry vendor portal.</p>
      <p>Our team will review your application and get back to you within <strong>24–48 hours</strong>.</p>
      <br/>
      <p>— The Forestry Team</p>
    `,
  })
}

// ── Access Approved ──────────────────────────────────────────────
export async function sendAccessApproved(to: string, name: string, password: string) {
  const { resend, from } = await getEmailConfig()
  return resend.emails.send({
    from, to,
    subject: 'Your Forestry vendor access has been approved!',
    html: `
      <h2>Welcome to Forestry, ${name}!</h2>
      <p>Your vendor access has been approved. Here are your login credentials:</p>
      <table>
        <tr><td><strong>Email:</strong></td><td>${to}</td></tr>
        <tr><td><strong>Password:</strong></td><td>${password}</td></tr>
      </table>
      <p><a href="${APP}/login">Sign in to your portal →</a></p>
      <p><strong>Please change your password after your first login.</strong></p>
      <br/>
      <p>— The Forestry Team</p>
    `,
  })
}

// ── Access Rejected ──────────────────────────────────────────────
export async function sendAccessRejected(to: string, name: string, reason?: string) {
  const { resend, from } = await getEmailConfig()
  return resend.emails.send({
    from, to,
    subject: 'Update on your Forestry vendor access request',
    html: `
      <h2>Hi ${name},</h2>
      <p>Thank you for your interest in the Forestry vendor portal.</p>
      <p>Unfortunately, we are unable to approve your access request at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you believe this is an error, please contact us at <a href="mailto:vendors@forestry.ae">vendors@forestry.ae</a>.</p>
      <br/>
      <p>— The Forestry Team</p>
    `,
  })
}

// ── Access Revoked ───────────────────────────────────────────────
export async function sendAccessRevoked(to: string, name: string, reason?: string) {
  const { resend, from } = await getEmailConfig()
  return resend.emails.send({
    from, to,
    subject: 'Your Forestry vendor access has been revoked',
    html: `
      <h2>Hi ${name},</h2>
      <p>We're writing to let you know that your access to the Forestry vendor portal has been revoked.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have questions or believe this was done in error, please contact us at <a href="mailto:vendors@forestry.ae">vendors@forestry.ae</a>.</p>
      <br/>
      <p>— The Forestry Team</p>
    `,
  })
}

// ── New RFP Notification (to admin) ─────────────────────────────
export async function sendNewRfpNotification(rfpNumber: string, vendorName: string, projectName?: string) {
  const { resend, from, adminEmail } = await getEmailConfig()
  return resend.emails.send({
    from,
    to: adminEmail,
    subject: `New RFP submitted: ${rfpNumber}`,
    html: `
      <h2>New RFP Received</h2>
      <p><strong>RFP Number:</strong> ${rfpNumber}</p>
      <p><strong>Vendor:</strong> ${vendorName}</p>
      ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
      <p><a href="${APP}/admin/rfps">View in Admin Portal →</a></p>
    `,
  })
}

// ── RFP Withdrawn (notify admin) ────────────────────────────────
export async function sendRfpWithdrawnNotification(rfpNumber: string, vendorName: string, projectName?: string) {
  const { resend, from, adminEmail } = await getEmailConfig()
  return resend.emails.send({
    from,
    to: adminEmail,
    subject: `RFP Withdrawn: ${rfpNumber}`,
    html: `
      <h2>RFP Withdrawn by Vendor</h2>
      <p><strong>RFP Number:</strong> ${rfpNumber}</p>
      <p><strong>Vendor:</strong> ${vendorName}</p>
      ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
      <p>The vendor has withdrawn this RFP before it was quoted. No further action required.</p>
      <p><a href="${APP}/admin/rfps">View in Admin Portal →</a></p>
    `,
  })
}

// ── Quote Sent (to vendor) ───────────────────────────────────────
export async function sendQuoteSent(
  to:         string,
  name:       string,
  rfpNumber:  string,
  rfpId:      string,
  total:      number,
  validUntil: Date | string,
) {
  const { resend, from } = await getEmailConfig()
  const validStr = new Date(validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return resend.emails.send({
    from, to,
    subject: `Your quotation for ${rfpNumber} is ready — AED ${total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#2D3436;">
        <h2 style="margin-bottom:4px;">Hi ${name},</h2>
        <p style="color:#636E6F;">Your quotation for <strong style="color:#2D3436;">${rfpNumber}</strong> is ready to review.</p>
        <div style="background:#FAF7F2;border:1px solid #E8E0D5;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#636E6F;">Total Amount</p>
          <p style="margin:0 0 16px;font-size:28px;font-weight:700;color:#B35C2A;">AED ${total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</p>
          <p style="margin:0;font-size:13px;color:#636E6F;">Valid until <strong style="color:#2D3436;">${validStr}</strong></p>
        </div>
        <a href="${APP}/portal/rfp/${rfpId}"
           style="display:inline-block;background:#B35C2A;color:#fff;font-weight:600;font-size:14px;
                  padding:12px 24px;border-radius:8px;text-decoration:none;">
          View &amp; Accept Quotation →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#8F9898;">
          If you have any questions, reply to this email or contact us at
          <a href="mailto:vendors@forestry.ae" style="color:#B35C2A;">vendors@forestry.ae</a>.
        </p>
        <p style="font-size:12px;color:#8F9898;">— The Forestry Team</p>
      </div>
    `,
  })
}

// ── Password Reset ───────────────────────────────────────────────
export async function sendPasswordReset(to: string, name: string, newPassword: string) {
  const { resend, from } = await getEmailConfig()
  return resend.emails.send({
    from, to,
    subject: 'Your Forestry password has been reset',
    html: `
      <h2>Hi ${name},</h2>
      <p>Your password has been reset. Your new temporary password is:</p>
      <p><strong>${newPassword}</strong></p>
      <p><a href="${APP}/login">Sign in →</a></p>
      <p><strong>Please change your password after logging in.</strong></p>
      <br/>
      <p>— The Forestry Team</p>
    `,
  })
}
