import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { sendQuoteSent }             from '@/lib/email'
import { writeAuditLog, getIp }      from '@/lib/auditLog'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body   = await req.json()
  const { status, items, subtotal, discount, tax, shipping, total, validUntil, terms, notes, productionDays, deliveryDays, deliveryCharges } = body

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
      include: { vendorProfile: { include: { user: true } } },
    })

    // Fire-and-forget vendor email
    sendQuoteSent(
      rfp.vendorProfile.user.email,
      rfp.vendorProfile.user.name,
      rfp.rfpNumber,
      id,
      total,
      validUntil,
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
