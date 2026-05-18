import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { z }                         from 'zod'

const itemSchema = z.object({
  productId:    z.string(),
  // standard
  dimensionId:  z.string().optional(),
  colorId:      z.string().optional(),
  textureId:    z.string().optional(),
  finishId:     z.string().optional(),
  // variant from specifications JSON
  variantName:  z.string().optional(),
  variantPrice: z.number().optional(),
  // custom size
  customWidth:      z.number().optional(),
  customHeight:     z.number().optional(),
  customDepth:      z.number().optional(),
  isCustomSize:     z.boolean().optional(),
  customDimensions: z.string().optional(), // JSON
  // custom colour
  customColorHex:  z.string().optional(),
  customColorRal:  z.string().optional(),
  customColorName: z.string().optional(),
  // custom texture
  customTextureUrl: z.string().optional(),
  // custom finish
  customFinishDesc: z.string().optional(),
  // holes
  holesOption: z.enum(['with_holes', 'without_holes']).optional(),
  // base
  quantity: z.number().min(1),
  notes:    z.string().optional(),
})

// GET /api/enquiry — returns current user's enquiry items
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.enquiryItem.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  // Fetch product details separately
  const productIds = [...new Set(items.map(i => i.productId))]
  const products   = await prisma.product.findMany({
    where:   { id: { in: productIds } },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  const enriched = items.map(item => ({
    ...item,
    product: productMap[item.productId],
  }))

  return NextResponse.json({ success: true, data: enriched })
}

// POST /api/enquiry — add item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const parsed = itemSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const d = parsed.data

    // Look for an existing line item with identical specs
    const existing = await prisma.enquiryItem.findFirst({
      where: {
        userId:           session.user.id,
        productId:        d.productId,
        // variant / standard attributes
        variantName:      d.variantName      ?? null,
        dimensionId:      d.dimensionId      ?? null,
        colorId:          d.colorId          ?? null,
        textureId:        d.textureId        ?? null,
        finishId:         d.finishId         ?? null,
        // custom size
        isCustomSize:     d.isCustomSize     ?? false,
        customDimensions: d.customDimensions ?? null,
        customWidth:      d.customWidth      ?? null,
        customHeight:     d.customHeight     ?? null,
        customDepth:      d.customDepth      ?? null,
        // custom colour
        customColorHex:   d.customColorHex  ?? null,
        customColorRal:   d.customColorRal  ?? null,
        customColorName:  d.customColorName ?? null,
        // custom texture / finish
        customTextureUrl: d.customTextureUrl ?? null,
        customFinishDesc: d.customFinishDesc ?? null,
        // holes
        holesOption:      d.holesOption     ?? null,
      },
    })

    if (existing) {
      const updated = await prisma.enquiryItem.update({
        where: { id: existing.id },
        data:  { quantity: existing.quantity + d.quantity },
      })
      return NextResponse.json({ success: true, data: updated, merged: true }, { status: 200 })
    }

    const item = await prisma.enquiryItem.create({
      data: { userId: session.user.id, ...d },
    })
    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/enquiry]', err)
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/enquiry — clear all items
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.enquiryItem.deleteMany({ where: { userId: session.user.id } })

  return NextResponse.json({ success: true })
}
