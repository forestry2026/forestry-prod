import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeAuditLog, getIp } from '@/lib/auditLog'

const basketItemSchema = z.object({
  productId:    z.string().optional().nullable(),
  productSku:   z.string().optional().nullable(),
  productName:  z.string(),
  variantName:  z.string().optional().nullable(),
  colorName:    z.string().optional().nullable(),
  textureName:  z.string().optional().nullable(),
  finishName:   z.string().optional().nullable(),
  colorId:      z.string().optional().nullable(),
  textureId:    z.string().optional().nullable(),
  finishId:     z.string().optional().nullable(),
  dimensionId:  z.string().optional().nullable(),
  variantPrice: z.number().optional().nullable(),
  isCustom:     z.boolean().default(false),
  quantity:     z.number().int().min(1).default(1),
  notes:        z.string().optional().nullable(), // includes serialized dimensions for custom items
})

const submitSchema = z.object({
  projectName:     z.string().optional().nullable(),
  projectLocation: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
  items:           z.array(basketItemSchema).min(1, 'At least one item is required'),
})

async function generateRfpNumber(): Promise<string> {
  const year   = new Date().getFullYear()
  const prefix = `RFP-${year}-`
  const last   = await prisma.rfp.findFirst({
    where:   { rfpNumber: { startsWith: prefix } },
    orderBy: { rfpNumber: 'desc' },
  })
  const seq = last ? parseInt(last.rfpNumber.split('-')[2] ?? '0') + 1 : 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Please sign in to submit an enquiry.' }, { status: 401 })
  }

  // Always look up vendor profile fresh from DB (JWT may be stale after profile creation)
  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  })

  // Auto-create a minimal pending vendor profile if the user is a VENDOR with no profile yet
  if (!vendorProfile && session.user.role === 'VENDOR') {
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId:      session.user.id,
        companyName: session.user.name ?? session.user.email,
        status:      'PENDING',
      },
    })
  }

  if (!vendorProfile) {
    return NextResponse.json(
      { error: 'Only vendor accounts can submit enquiries. Please contact us to set up your vendor account.' },
      { status: 403 }
    )
  }

  const body   = await req.json()
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Invalid request'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { projectName, projectLocation, deliveryAddress, notes, items } = parsed.data

  const rfpNumber = await generateRfpNumber()

  const rfp = await prisma.rfp.create({
    data: {
      rfpNumber,
      vendorProfileId: vendorProfile.id,
      projectName:     projectName     ?? null,
      projectLocation: projectLocation ?? null,
      deliveryAddress: deliveryAddress ?? null,
      notes:           notes           ?? null,
      status:          'SUBMITTED',
      submittedAt:     new Date(),
      items: {
        create: items.map(item => ({
          productId:   item.productId   ?? null,
          productName: item.productName,
          productSku:  item.productSku  ?? null,
          isCustom:    item.isCustom,
          dimensionId: item.dimensionId ?? null,
          colorId:     item.colorId     ?? null,
          textureId:   item.textureId   ?? null,
          finishId:    item.finishId    ?? null,
          quantity:   item.quantity,
          unitPrice:  item.variantPrice ?? null,
          notes: [
            item.variantName  ? `Variant: ${item.variantName}`  : null,
            item.colorName    ? `Color: ${item.colorName}`      : null,
            item.textureName  ? `Texture: ${item.textureName}`  : null,
            item.finishName   ? `Finish: ${item.finishName}`    : null,
            item.notes        ?? null,  // already includes serialized dimensions from client
          ].filter(Boolean).join(' | ') || null,
        })),
      },
    },
  })

  await writeAuditLog({
    userId:     session.user.id,
    action:     'RFP_SUBMITTED',
    entityType: 'RFP',
    entityId:   rfp.id,
    details:    { actorName: session.user.name, actorRole: session.user.role, rfpNumber: rfp.rfpNumber, itemCount: items.length },
    ipAddress:  getIp(req),
  })

  return NextResponse.json(
    { success: true, data: { id: rfp.id, rfpNumber: rfp.rfpNumber } },
    { status: 201 }
  )
}
