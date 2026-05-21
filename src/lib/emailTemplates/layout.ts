/**
 * Shared HTML shell for every transactional email.
 * Forestry brand: light background, charcoal text, terracotta accents.
 *
 * Callers pass an HTML `body` (the unique part). Layout wraps it with
 * header (logo / wordmark), surrounding chrome, and footer.
 *
 * Keep styles INLINE — many email clients strip <style> blocks.
 */

const COLORS = {
  outerBg:   '#F6F3EE',   // soft warm off-white outer canvas
  card:      '#FFFFFF',
  border:    '#E8E0D5',
  divider:   '#F0EBE3',
  headerBg:  '#FBF7F1',   // very subtle cream wash behind the brand mark
  footerBg:  '#FAF7F2',
  charcoal:  '#2D2926',
  body:      '#52473F',
  muted:     '#8C8378',
  terracotta:'#C96B4A',
}

export function emailLayout(body: string): string {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forestry</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.outerBg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${COLORS.charcoal};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.outerBg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;background:${COLORS.card};border-radius:18px;overflow:hidden;border:1px solid ${COLORS.border};box-shadow:0 1px 2px rgba(45,41,38,0.04),0 8px 24px -16px rgba(45,41,38,0.10);">

          <!-- Header band -->
          <tr>
            <td style="padding:32px 40px 22px;background:${COLORS.headerBg};border-bottom:1px solid ${COLORS.divider};">
              <!--BRAND_HEADER-->
              <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.18em;margin-top:10px;font-weight:600;">Custom Pots · Made to Order</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 36px;font-size:14px;line-height:1.65;color:${COLORS.body};">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 24px;background:${COLORS.footerBg};border-top:1px solid ${COLORS.divider};font-size:11.5px;color:${COLORS.muted};text-align:center;line-height:1.5;">
              <div style="font-weight:700;color:${COLORS.charcoal};letter-spacing:0.06em;margin-bottom:4px;">FORESTRY</div>
              <div>vendors@forestry.ae</div>
              <div style="margin-top:8px;font-size:10.5px;color:${COLORS.muted};">You received this email because you have an account or made a request on our portal.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

/**
 * Build the header brand block — either an admin-uploaded logo image
 * or the italic "Forestry" wordmark fallback.
 */
export function brandHeaderHtml(logoUrl: string | null | undefined): string {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="Forestry" style="max-height:38px;max-width:180px;display:block;height:auto;" />`
  }
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:28px;color:${COLORS.charcoal};line-height:1;letter-spacing:-0.01em;">Forestry</div>`
}

/** Primary terracotta CTA button. */
export function ctaButton(url: string, label: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 18px;">
  <tr>
    <td style="border-radius:10px;background:${COLORS.terracotta};">
      <a href="${url}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:13.5px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.04em;border-radius:10px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`.trim()
}

/** Compact key-value callout box. Used for things like RFP numbers, totals. */
export function callout(label: string, value: string, mono = false): string {
  return `
<div style="margin:16px 0;padding:14px 18px;background:${COLORS.headerBg};border:1px solid ${COLORS.divider};border-radius:10px;">
  <div style="font-size:10px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:0.14em;font-weight:700;">${label}</div>
  <div style="margin-top:5px;font-size:${mono ? '14.5px' : '15.5px'};font-weight:700;color:${COLORS.charcoal};${mono ? `font-family:'SF Mono',Menlo,Consolas,monospace;letter-spacing:0.02em;` : ''}">${value}</div>
</div>`.trim()
}
