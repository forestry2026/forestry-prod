import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { sendQuoteSent }             from '@/lib/email'
import { writeAuditLog, getIp }      from '@/lib/auditLog'
import { generateQuotePdfBuffer }    from '@/lib/generateQuotePdf'
import { cloudinaryRowThumb, cloudinaryLogo } from '@/lib/cloudinaryUrl'

export const runtime = 'nodejs'

/**
 * Fetch an image URL and return a base64 data URL.
 * Used to embed Cloudinary images inside the PDF.
 * Returns null on any failure so PDF generation never blocks on a broken image.
 */
async function urlToDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf  = Buffer.from(await res.arrayBuffer())
    const mime = res.headers.get('content-type') ?? 'image/jpeg'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body   = await req.json()
  const {
    status, items, subtotal, discount, tax, shipping, total,
    validUntil, terms, notes, productionDays, deliveryDays, deliveryCharges,
  } = body

  const isSending = status === 'SENT'

  // Update unit prices on items
  if (items?.length) {
    await Promise.all(
      items.map((item: { id: string; unitPrice: number; quantity: number }) =>
        prisma.rfpItem.update({
          where: { id: item.id },
          data:  { unitPrice: item.unitPrice, totalPrice: item.unitPrice * item.quantity },
        })
      )
    )
  }

  // Upsert quote — only stamp sentAt when actually sending
  const existing  = await prisma.rfpQuote.findFirst({ where: { rfpId: id } })
  const quoteData = {
    rfpId:           id,
    quotedById:      session.user.id,
    subtotal,
    discount:        discount        ?? null,
    tax:             tax             ?? null,
    shipping:        shipping        ?? null,
    total,
    validUntil:      new Date(validUntil),
    terms:           terms           ?? null,
    notes:           notes           ?? null,
    productionDays:  productionDays  ? Number(productionDays)  : null,
    deliveryDays:    deliveryDays    ? Number(deliveryDays)     : null,
    deliveryCharges: deliveryCharges ? Number(deliveryCharges)  : null,
    sentAt:          isSending ? new Date() : null,
  }

  if (existing) {
    await prisma.rfpQuote.update({ where: { id: existing.id }, data: quoteData })
  } else {
    await prisma.rfpQuote.create({ data: quoteData })
  }

  // Only promote the RFP and notify vendor when actually sending
  if (isSending) {
    const rfp = await prisma.rfp.update({
      where: { id },
      data:  { status: 'QUOTED', quotationSentAt: new Date(), revisionRequest: null },
      include: {
        vendorProfile: { include: { user: true } },
        items: {
          include: {
            // Prefer the primary image; fall back to first available so every line still gets a thumbnail.
            product: { include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 } } },
            color:   true,
            texture: true,
            finish:  true,
            dimension: true,
          },
        },
      },
    })

    // Build PDF on the server so we can attach it to the email
    let pdfBuffer: Buffer | null = null
    try {
      // Fetch site logo + company contact details (shown in PDF footer)
      const settings = await prisma.siteSetting.findMany({
        where: { key: { in: ['logoUrl', 'company_name', 'company_trn', 'company_email', 'company_phone', 'company_address'] } },
      })
      const settingMap = Object.fromEntries(settings.map(s => [s.key, s.value]))

      const [logoDataUrl, vendorLogoDataUrl] = await Promise.all([
        urlToDataUrl(cloudinaryLogo(settingMap['logoUrl'])),
        urlToDataUrl(cloudinaryLogo(rfp.vendorProfile.logoUrl)),
      ])

      // Fetch primary product images for line items (parallel)
      const lineItems = await Promise.all(
        rfp.items.map(async (it) => {
          const imgUrl = it.product?.images?.[0]?.url ?? null
          const imageDataUrl = await urlToDataUrl(cloudinaryRowThumb(imgUrl))

          const sizeBits = [
            it.dimension?.name,
            it.customWidth ? `${it.customWidth}w` : null,
            it.customHeight ? `${it.customHeight}h` : null,
            it.customDepth ? `${it.customDepth}d` : null,
          ].filter(Boolean).join(' × ')

          return {
            productName:       it.productName ?? it.product?.name ?? null,
            productSku:        it.productSku  ?? it.product?.sku  ?? null,
            isCustom:          it.isCustom,
            quantity:          it.quantity,
            computedUnitPrice: it.unitPrice ?? 0,
            lineTotal:         it.totalPrice ?? (it.unitPrice ?? 0) * it.quantity,
            sizeLabel:         sizeBits || null,
            color:             it.color   ? { name: it.color.name }   : null,
            texture:           it.texture ? { name: it.texture.name } : null,
            finish:            it.finish  ? { name: it.finish.name }  : null,
            imageDataUrl,
          }
        })
      )

      const taxPct = subtotal && tax ? (tax / subtotal) * 100 : 0

      pdfBuffer = generateQuotePdfBuffer({
        rfpNumber:       rfp.rfpNumber,
        companyName:     rfp.vendorProfile.companyName,
        contactName:     rfp.vendorProfile.user.name,
        contactEmail:    rfp.vendorProfile.user.email,
        lineItems,
        subtotal:        subtotal ?? 0,
        discountPct:     0,
        discountAmt:     discount ?? 0,
        taxPct,
        taxAmt:          tax ?? 0,
        deliveryCharges: deliveryCharges ? Number(deliveryCharges) : 0,
        total,
        validUntil,
        productionDays:  productionDays ? Number(productionDays) : null,
        deliveryDays:    deliveryDays   ? Number(deliveryDays)   : null,
        terms:           terms ?? null,
        logoDataUrl,
        vendorLogoDataUrl,
        senderCompanyName: settingMap['company_name']    ?? null,
        companyTrn:        settingMap['company_trn']     ?? null,
        companyEmail:   settingMap['company_email']   ?? null,
        companyPhone:   settingMap['company_phone']   ?? null,
        companyAddress: settingMap['company_address'] ?? null,
      })
    } catch (err) {
      console.error('[quote] PDF generation failed, sending email without attachment:', err)
    }

    // Fire-and-forget vendor email
    sendQuoteSent(
      rfp.vendorProfile.user.email,
      rfp.vendorProfile.user.name,
      rfp.rfpNumber,
      id,
      total,
      validUntil,
      pdfBuffer ? { filename: `Quote-${rfp.rfpNumber}.pdf`, content: pdfBuffer } : null,
    ).catch(console.error)

    await writeAuditLog({
      userId:     session.user.id,
      action:     'RFP_QUOTED',
      entityType: 'RFP',
      entityId:   id,
      details:    { actorName: session.user.name, actorRole: session.user.role, rfpNumber: rfp.rfpNumber, total },
      ipAddress:  getIp(req),
    })
  }

  return NextResponse.json({ success: true })
}
