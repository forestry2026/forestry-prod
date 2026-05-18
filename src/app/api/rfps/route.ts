import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { z }                         from 'zod'
import { generateRfpNumber }         from '@/lib/utils'
import { sendNewRfpNotification }    from '@/lib/email'

const rfpSchema = z.object({
  projectName:     z.string().optional(),
  projectLocation: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes:           z.string().optional(),
  items: z.array(z.object({
    productId:    z.string(),
    dimensionId:  z.string().optional(),
    colorId:      z.string().optional(),
    textureId:    z.string().optional(),
    finishId:     z.string().optional(),
    // variant
    variantName:  z.string().optional(),
    variantPrice: z.number().optional(),
    // custom size
    isCustomSize:     z.boolean().optional(),
    customDimensions: z.string().optional(),
    customWidth:      z.number().optional(),
    customHeight:     z.number().optional(),
    customDepth:      z.number().optional(),
    // custom colour
    customColorHex:  z.string().optional(),
    customColorRal:  z.string().optional(),
    customColorName: z.string().optional(),
    // custom texture
    customTextureUrl: z.string().optional(),
    // custom finish
    customFinishDesc: z.string().optional(),
    // holes
    holesOption: z.string().optional(),
    quantity:    z.number().min(1),
    notes:       z.string().optional(),
  })).min(1, 'At least one item is required'),
})

// GET /api/rfps
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let where: any = {}

  if (session.user.role === 'VENDOR') {
    if (!session.user.vendorProfileId) return NextResponse.json({ data: [] })
    where.vendorProfileId = session.user.vendorProfileId
  }

  if (status && status !== 'ALL') where.status = status

  const rfps = await prisma.rfp.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items:        { include: { product: true, dimension: true, color: true, texture: true, finish: true } },
      quotes:       { orderBy: { createdAt: 'desc' }, take: 1 },
      vendorProfile: { include: { user: { select: { name: true, email: true } } } },
    },
  })

  return NextResponse.json({ success: true, data: rfps })
}

// POST /api/rfps — vendor submits new RFP
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.user.vendorProfileId) {
    return NextResponse.json({ error: 'Vendor profile not found' }, { status: 400 })
  }

  const body   = await req.json()
  const parsed = rfpSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })

  // Retry up to 5 times on unique constraint collision (P2002)
  let rfp: any
  let lastErr: any
  for (let attempt = 0; attempt < 5; attempt++) {
    const rfpNumber = await generateRfpNumber(prisma)
    try {
      rfp = await prisma.rfp.create({
        data: {
          rfpNumber,
          vendorProfileId: session.user.vendorProfileId,
          projectName:     parsed.data.projectName,
          projectLocation: parsed.data.projectLocation,
          deliveryAddress: parsed.data.deliveryAddress,
          notes:           parsed.data.notes,
          status:          'SUBMITTED',
          submittedAt:     new Date(),
          items: {
            createMany: { data: parsed.data.items },
          },
        },
        include: { vendorProfile: { include: { user: true } }, items: true },
      })
      break // success
    } catch (err: any) {
      lastErr = err
      if (err?.code !== 'P2002') {
        return NextResponse.json({ error: err?.message ?? 'Failed to create RFP' }, { status: 500 })
      }
      // P2002 = unique constraint on rfpNumber — retry with fresh number
    }
  }
  if (!rfp) {
    return NextResponse.json({ error: lastErr?.message ?? 'Failed to generate unique RFP number' }, { status: 500 })
  }

  // Notify admin
  sendNewRfpNotification(rfp.rfpNumber, rfp.vendorProfile.user.name, parsed.data.projectName).catch(console.error)

  // Clear enquiry items
  await prisma.enquiryItem.deleteMany({ where: { userId: session.user.id } })

  // AuditLog.details is String? — must be a string, not an object
  await prisma.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     'RFP_SUBMITTED',
      entityType: 'RFP',
      entityId:   rfp.id,
      details:    JSON.stringify({ rfpNumber: rfp.rfpNumber }),
    },
  })

  return NextResponse.json({ success: true, data: { id: rfp.id, rfpNumber: rfp.rfpNumber } }, { status: 201 })
}
