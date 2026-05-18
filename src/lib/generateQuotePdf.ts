import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/* ────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────── */
interface QuoteLineItem {
  productName?:  string | null
  productSku?:   string | null
  isCustom:      boolean
  quantity:      number
  computedUnitPrice: number
  lineTotal:     number
  sizeLabel?:    string | null
  color?:   { name: string } | null
  texture?: { name: string } | null
  finish?:  { name: string } | null
  imageDataUrl?: string | null
}

export interface QuotePdfOptions {
  rfpNumber:       string
  companyName:     string
  contactName:     string
  contactEmail:    string
  lineItems:       QuoteLineItem[]
  subtotal:        number
  discountPct:     number
  discountAmt:     number
  taxPct:          number
  taxAmt:          number
  deliveryCharges: number
  total:           number
  validUntil:      string
  productionDays?: number | null
  deliveryDays?:   number | null
  terms?:            string | null
  logoDataUrl?:      string | null
  vendorLogoDataUrl?: string | null
  /** Footer info — issuer company name, TRN, email, phone, address. Shown on the last page. */
  senderCompanyName?: string | null
  companyTrn?:        string | null
  companyEmail?:      string | null
  companyPhone?:      string | null
  companyAddress?:    string | null
}

/* ────────────────────────────────────────────────────────────────────
 * Palette + layout constants
 * ──────────────────────────────────────────────────────────────────── */
const CHARCOAL   = [42,  38,  35]  as [number, number, number]
const TERRACOTTA = [201, 107, 74]  as [number, number, number]
const CREAM      = [248, 244, 240] as [number, number, number]
const PANEL_BG   = [243, 237, 230] as [number, number, number]
const STATS_BG   = [248, 244, 240] as [number, number, number]
const RULE       = [218, 210, 202] as [number, number, number]
const FRAME      = [228, 220, 212] as [number, number, number]
const MUTED      = [148, 138, 130] as [number, number, number]
const BODY       = [78,  70,  64]  as [number, number, number]
const WHITE      = [255, 255, 255] as [number, number, number]

const PAGE_W = 210 // A4 width mm
const PAGE_H = 297 // A4 height mm
const ML = 14
const MR = 14
const MT = 10
const MB = 12

/* ────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────── */
function hRule(doc: jsPDF, y: number, x1: number, x2: number, color: [number, number, number] = RULE, width = 0.25) {
  doc.setDrawColor(...color)
  doc.setLineWidth(width)
  doc.line(x1, y, x2, y)
}

function microLabel(doc: jsPDF, text: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left') {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...TERRACOTTA)
  doc.text(text.toUpperCase(), x, y, { align, charSpace: 0.4 })
}

function bodyLine(
  doc: jsPDF, text: string, x: number, y: number,
  size = 9, bold = false,
  color: [number, number, number] = CHARCOAL,
  align: 'left' | 'right' | 'center' = 'left',
) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal')
  doc.setFontSize(size)
  doc.setTextColor(...color)
  doc.text(text, x, y, { align })
}

function fmtAed(n: number): string {
  return `AED ${n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Number only — no currency prefix. Used inside columns whose header already says "AED". */
function fmtNum(n: number): string {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return s }
}

function imgFmt(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png'))  return 'PNG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  if (dataUrl.startsWith('data:image/gif'))  return 'GIF'
  return 'JPEG'
}

/**
 * Break to a new page if `neededSpace` won't fit before the footer.
 * Returns the new y position (resets to top margin if a page was added).
 * Also re-draws the page frame on the new page.
 */
function ensureSpace(doc: jsPDF, y: number, neededSpace: number, footerReserve: number): number {
  if (y + neededSpace <= PAGE_H - footerReserve) return y
  doc.addPage()
  // Frame is drawn for all pages in the final footer pass.
  return MT + 4
}

function fitImage(doc: jsPDF, dataUrl: string, x: number, y: number, maxW: number, maxH: number) {
  try {
    const props = doc.getImageProperties(dataUrl)
    const ratio = props.width / props.height
    let w = maxW
    let h = w / ratio
    if (h > maxH) { h = maxH; w = h * ratio }
    const cx = x + (maxW - w) / 2
    const cy = y + (maxH - h) / 2
    doc.addImage(dataUrl, imgFmt(dataUrl), cx, cy, w, h)
  } catch { /* skip broken image */ }
}

/* ────────────────────────────────────────────────────────────────────
 * Build the document
 * ──────────────────────────────────────────────────────────────────── */
function buildQuoteDoc(opts: QuotePdfOptions): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  /* ── Header ──────────────────────────────────────────────────── */
  // (Outer frame is drawn on every page in the final footer pass.)
  // Logo (left) — uses uploaded brand logo if present, otherwise an italic serif wordmark.
  if (opts.logoDataUrl) {
    fitImage(doc, opts.logoDataUrl, ML, 14, 38, 14)
  } else {
    doc.setFont('times', 'italic')
    doc.setFontSize(19)
    doc.setTextColor(...CHARCOAL)
    doc.text('Forestry', ML, 26)
  }

  // QUOTATION title (right) — vertically centred with the logo (logo top=14, h=14 → centre ≈21).
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.setTextColor(...CHARCOAL)
  doc.text('QUOTATION', PAGE_W - MR, 21, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text(opts.rfpNumber, PAGE_W - MR, 27, { align: 'right' })

  // Terracotta divider
  hRule(doc, 40, ML, PAGE_W - MR, TERRACOTTA, 0.5)

  /* ── Meta strip ──────────────────────────────────────────────── */
  let y = 47
  const colW = (PAGE_W - ML - MR) / 3

  microLabel(doc, 'Date Issued', ML, y)
  microLabel(doc, 'Valid Until', ML + colW, y)
  microLabel(doc, 'Reference No.', ML + colW * 2, y)

  bodyLine(doc, fmtDate(new Date().toISOString()), ML, y + 6, 9, false, CHARCOAL)
  bodyLine(doc, fmtDate(opts.validUntil), ML + colW, y + 6, 9, false, CHARCOAL)
  bodyLine(doc, opts.rfpNumber, ML + colW * 2, y + 6, 9, false, CHARCOAL)

  y += 14
  hRule(doc, y, ML, PAGE_W - MR)

  /* ── Info panels (Prepared For + Stats) ──────────────────────── */
  y += 6
  const panelH = 30
  const leftW  = (PAGE_W - ML - MR) * 0.58 - 3
  const rightW = (PAGE_W - ML - MR) * 0.42 - 3
  const rightX = ML + leftW + 6

  // Left: PREPARED FOR
  doc.setFillColor(...PANEL_BG)
  doc.roundedRect(ML, y, leftW, panelH, 1.5, 1.5, 'F')

  microLabel(doc, 'Prepared For', ML + 6, y + 6)
  bodyLine(doc, opts.companyName, ML + 6, y + 13, 11, true, CHARCOAL)
  bodyLine(doc, opts.contactName, ML + 6, y + 18, 8, false, BODY)
  bodyLine(doc, opts.contactEmail, ML + 6, y + 22, 7, false, MUTED)

  // Vendor logo inside panel (right side of left panel, vertically centered)
  if (opts.vendorLogoDataUrl) {
    fitImage(doc, opts.vendorLogoDataUrl, ML + leftW - 22, y + 6, 16, 16)
  }

  // Right: STATS — vertical stack of three label/value rows.
  // Each row: micro label on the left, value on the right.
  doc.setFillColor(...STATS_BG)
  doc.roundedRect(rightX, y, rightW, panelH, 1.5, 1.5, 'F')

  const totalItems = opts.lineItems.length
  const totalUnits = opts.lineItems.reduce((s, it) => s + it.quantity, 0)
  const rowGap = panelH / 3
  const padX = 6
  const labelY1 = y + rowGap * 0.5 + 1
  const labelY2 = y + rowGap * 1.5 + 1
  const labelY3 = y + rowGap * 2.5 + 1

  microLabel(doc, 'Items',       rightX + padX, labelY1)
  microLabel(doc, 'Total Units', rightX + padX, labelY2)
  microLabel(doc, 'Quote Value', rightX + padX, labelY3)

  bodyLine(doc, String(totalItems), rightX + rightW - padX, labelY1, 9, true, CHARCOAL, 'right')
  bodyLine(doc, String(totalUnits), rightX + rightW - padX, labelY2, 9, true, CHARCOAL, 'right')
  bodyLine(doc, fmtAed(opts.total), rightX + rightW - padX, labelY3, 9, true, TERRACOTTA, 'right')

  y += panelH + 8

  /* ── Line items table ────────────────────────────────────────── */
  const head = [[
    { content: '#',              styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } as any } },
    { content: '',               styles: { fillColor: CHARCOAL } },
    { content: 'Product',        styles: { halign: 'left'   as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7 } },
    { content: 'Specifications', styles: { halign: 'left'   as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7 } },
    { content: 'Qty',            styles: { halign: 'center' as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7 } },
    { content: 'Unit Price\nAED', styles: { halign: 'right'  as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7 } },
    { content: 'Amount\nAED',     styles: { halign: 'right'  as const, valign: 'middle' as const, fontStyle: 'normal' as const, textColor: WHITE, fontSize: 7 } },
  ]]

  const rows = opts.lineItems.map((it, i) => {
    const specsLines: string[] = []
    if (it.sizeLabel)     specsLines.push(`Size: ${it.sizeLabel}`)
    if (it.color?.name)   specsLines.push(`Colour: ${it.color.name}`)
    if (it.texture?.name) specsLines.push(`Texture: ${it.texture.name}`)
    if (it.finish?.name)  specsLines.push(`Finish: ${it.finish.name}`)
    if (it.productSku)    specsLines.push(`SKU: ${it.productSku}`)
    const specs = specsLines.join('\n') || '—'

    const name = it.productName ?? (it.isCustom ? 'Custom item' : '—')
    const idx  = String(i + 1).padStart(2, '0')

    return [
      { content: idx,                   styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 6.5, textColor: MUTED } },
      { content: '',                    styles: { valign: 'middle' as const } },
      { content: name,                  styles: { halign: 'left'   as const, valign: 'middle' as const, fontSize: 8, textColor: CHARCOAL } },
      { content: specs,                 styles: { halign: 'left'   as const, valign: 'middle' as const, fontSize: 7, textColor: BODY, cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } as any } },
      { content: String(it.quantity),   styles: { halign: 'center' as const, valign: 'middle' as const, fontSize: 8, textColor: CHARCOAL } },
      { content: fmtNum(it.computedUnitPrice), styles: { halign: 'right' as const, valign: 'middle' as const, fontSize: 8, textColor: CHARCOAL } },
      { content: fmtNum(it.lineTotal),         styles: { halign: 'right' as const, valign: 'middle' as const, fontSize: 8, textColor: CHARCOAL } },
    ]
  })

  // Reserve space at bottom for footer so multi-page tables don't overlap it.
  const FOOTER_RESERVE = 20

  autoTable(doc, {
    startY: y,
    head,
    body: rows,
    theme: 'grid',
    margin: { left: ML, right: MR, bottom: FOOTER_RESERVE },
    // Keep a product row on one page — image/name/specs always together.
    rowPageBreak: 'avoid',
    styles: {
      lineColor: RULE,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: CHARCOAL,
      textColor: WHITE,
      lineColor: CHARCOAL,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 } as any,
      minCellHeight: 10,
    },
    bodyStyles: {
      fillColor: WHITE,
      cellPadding: 3,
      minCellHeight: 22,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 36 },
      3: { cellWidth: 52 },
      4: { cellWidth: 14 },
      5: { cellWidth: 26 },
      6: { cellWidth: 22 },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 1) return
      const item = opts.lineItems[data.row.index]
      if (!item?.imageDataUrl) return
      try {
        const cell = data.cell
        const pad  = 2
        const maxW = cell.width  - pad * 2
        const maxH = cell.height - pad * 2
        const props = doc.getImageProperties(item.imageDataUrl)
        const ratio = props.width / props.height
        let w = maxW
        let h = w / ratio
        if (h > maxH) { h = maxH; w = h * ratio }
        const cx = cell.x + (cell.width  - w) / 2
        const cy = cell.y + (cell.height - h) / 2
        doc.addImage(item.imageDataUrl, imgFmt(item.imageDataUrl), cx, cy, w, h)
      } catch { /* skip broken image */ }
    },
  })

  // @ts-ignore — autoTable typings don't expose lastAutoTable
  y = (doc as any).lastAutoTable.finalY + 6

  // Summary needs ~50mm. Lead times + terms variable. Break to new page if not enough room.
  y = ensureSpace(doc, y, 50, FOOTER_RESERVE)

  /* ── Pricing summary (right-aligned, ~half width) ────────────── */
  const sumW = 90
  const sumX = PAGE_W - MR - sumW

  // Subtotal row
  doc.setFillColor(...PANEL_BG)
  doc.rect(sumX, y, sumW, 9, 'F')
  bodyLine(doc, 'Subtotal', sumX + 5, y + 6, 8, false, CHARCOAL)
  bodyLine(doc, fmtAed(opts.subtotal), sumX + sumW - 5, y + 6, 8, false, CHARCOAL, 'right')
  y += 9

  // Optional discount
  if (opts.discountAmt > 0) {
    doc.setFillColor(...WHITE)
    doc.rect(sumX, y, sumW, 8, 'F')
    bodyLine(doc, 'Discount', sumX + 5, y + 5.5, 7.5, false, BODY)
    bodyLine(doc, `- ${fmtAed(opts.discountAmt)}`, sumX + sumW - 5, y + 5.5, 7.5, false, CHARCOAL, 'right')
    y += 8
  }
  // Optional VAT
  if (opts.taxAmt > 0) {
    doc.setFillColor(...WHITE)
    doc.rect(sumX, y, sumW, 8, 'F')
    bodyLine(doc, `VAT (${Math.round(opts.taxPct)}%)`, sumX + 5, y + 5.5, 7.5, false, BODY)
    bodyLine(doc, fmtAed(opts.taxAmt), sumX + sumW - 5, y + 5.5, 7.5, false, CHARCOAL, 'right')
    y += 8
  }
  // Optional delivery
  if (opts.deliveryCharges > 0) {
    doc.setFillColor(...WHITE)
    doc.rect(sumX, y, sumW, 8, 'F')
    bodyLine(doc, 'Delivery', sumX + 5, y + 5.5, 7.5, false, BODY)
    bodyLine(doc, fmtAed(opts.deliveryCharges), sumX + sumW - 5, y + 5.5, 7.5, false, CHARCOAL, 'right')
    y += 8
  }

  // Total band — terracotta
  doc.setFillColor(...TERRACOTTA)
  doc.rect(sumX, y, sumW, 12, 'F')
  bodyLine(doc, 'TOTAL DUE', sumX + 5, y + 8, 10, true, WHITE)
  bodyLine(doc, fmtAed(opts.total), sumX + sumW - 5, y + 8, 10, true, WHITE, 'right')
  y += 12

  y += 5

  /* ── Lead times (optional, before terms) ─────────────────────── */
  if (opts.productionDays || opts.deliveryDays) {
    y = ensureSpace(doc, y, 12, FOOTER_RESERVE)
    microLabel(doc, 'Lead times', ML, y)
    y += 3

    let cx = ML
    if (opts.productionDays) {
      const text = `Production: ${opts.productionDays} day${opts.productionDays !== 1 ? 's' : ''}`
      const w = doc.getTextWidth(text) + 8
      doc.setFillColor(...CREAM)
      doc.roundedRect(cx, y, w, 6, 3, 3, 'F')
      bodyLine(doc, text, cx + 4, y + 4, 7, false, CHARCOAL)
      cx += w + 4
    }
    if (opts.deliveryDays) {
      const text = `Delivery: ${opts.deliveryDays} day${opts.deliveryDays !== 1 ? 's' : ''}`
      const w = doc.getTextWidth(text) + 8
      doc.setFillColor(...CREAM)
      doc.roundedRect(cx, y, w, 6, 3, 3, 'F')
      bodyLine(doc, text, cx + 4, y + 4, 7, false, CHARCOAL)
    }
    y += 9
  }

  /* ── Terms & conditions (always rendered) ────────────────────── */
  {
    const termsText = opts.terms?.trim() || 'Standard payment and delivery terms apply. Prices valid for 30 days from issue date.'
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    const lines = doc.splitTextToSize(termsText, PAGE_W - ML - MR)
    const blockH = 14 + lines.length * 4
    y = ensureSpace(doc, y, blockH, FOOTER_RESERVE)

    hRule(doc, y - 2, ML, PAGE_W - MR)
    microLabel(doc, 'Terms & Conditions', ML, y + 4)
    y += 9
    doc.setTextColor(...BODY)
    doc.text(lines, ML, y)
    y += lines.length * 4 + 4
  }

  /* ── Frame on every page + footer disclaimer on the last ─────── */
  const totalPages = (doc as any).getNumberOfPages?.() ?? 1
  const frameInsetEnd = 6
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    // Draw the outer rounded frame on every page (autoTable adds extra pages
    // that don't go through ensureSpace, so we re-draw here unconditionally).
    doc.setDrawColor(...FRAME)
    doc.setLineWidth(0.3)
    doc.roundedRect(frameInsetEnd, frameInsetEnd, PAGE_W - frameInsetEnd * 2, PAGE_H - frameInsetEnd * 2, 2, 2)

    // Company info + disclaimer — only on the last page.
    if (i === totalPages) {
      const name    = opts.senderCompanyName?.trim()
      const address = opts.companyAddress?.trim()
      const email   = opts.companyEmail?.trim()
      const phone   = opts.companyPhone?.trim()
      const trn     = opts.companyTrn?.trim()
      const contactBits = [email, phone, trn ? `TRN: ${trn}` : null].filter(Boolean)

      const baseY = PAGE_H - MB - 6 // disclaimer baseline
      const LINE  = 3.8             // vertical step between rows
      let lineY   = baseY - LINE    // start one line above disclaimer

      // Stack rendered bottom-up so multi-line address always sits between
      // the company name (above) and the contact strip (below).
      if (contactBits.length) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...BODY)
        doc.text(contactBits.join('   ·   '), PAGE_W / 2, lineY, { align: 'center' })
        lineY -= LINE
      }

      if (address) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...BODY)
        // Address may contain explicit `\n` or be longer than the page width.
        const lines = doc.splitTextToSize(address, PAGE_W - ML - MR)
        // Draw from bottom-most line up so multi-line wraps stack correctly above.
        for (let k = lines.length - 1; k >= 0; k--) {
          doc.text(lines[k], PAGE_W / 2, lineY, { align: 'center' })
          lineY -= LINE
        }
      }

      if (name) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...CHARCOAL)
        doc.text(name, PAGE_W / 2, lineY, { align: 'center' })
      }

      // Disclaimer at the very bottom of the footer area.
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...MUTED)
      doc.text(
        'This document constitutes a formal quotation and is subject to the terms stated above.',
        PAGE_W / 2, baseY, { align: 'center' },
      )
    }
  }

  return doc
}

/* ────────────────────────────────────────────────────────────────────
 * Public APIs
 * ──────────────────────────────────────────────────────────────────── */
export function generateQuotePdf(opts: QuotePdfOptions, filename?: string): void {
  const doc = buildQuoteDoc(opts)
  const name = filename ?? `Quote-${opts.rfpNumber}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(name)
}

export function generateQuotePdfBuffer(opts: QuotePdfOptions): Buffer {
  const doc = buildQuoteDoc(opts)
  const arr = doc.output('arraybuffer')
  return Buffer.from(arr)
}
