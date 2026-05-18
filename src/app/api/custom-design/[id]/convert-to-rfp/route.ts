import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    const design = await prisma.customDesignRequest.findUnique({
      where:   { id },
      include: { vendorProfile: true },
    })
    if (!design) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const rfpNumber = await generateRfpNumber()

    const rfp = await prisma.rfp.create({
      data: {
        rfpNumber,
        vendorProfileId: design.vendorProfileId,
        projectName:     design.title,
        notes:           [design.description, design.notes].filter(Boolean).join('\n\n') || null,
        status:          'SUBMITTED',
        submittedAt:     new Date(),
        items: {
          create: {
            productName:     design.title,
            isCustom:        true,
            isCustomSize:    design.dimensions ? JSON.parse(design.dimensions).length > 0 : false,
            customDimensions:design.dimensions ?? null,
            colorId:         design.colorId    ?? null,
            textureId:       design.textureId  ?? null,
            finishId:        design.finishId   ?? null,
            customColorHex:  design.customColorHex  ?? null,
            customColorRal:  design.customColorRal  ?? null,
            customColorName: design.customColorName ?? null,
            customTextureUrl:design.customTextureUrl ?? null,
            holesOption:     design.holesOption ?? null,
            quantity:        design.quantity,
            notes: design.customTexture ?? null,
          },
        },
      },
    })

    // Mark the custom design as converted (reviewing → keeps audit trail)
    await prisma.customDesignRequest.update({
      where: { id },
      data:  {
        status:     'reviewing',
        adminNotes: [
          design.adminNotes,
          `Converted to RFP ${rfpNumber} on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`,
        ].filter(Boolean).join('\n\n'),
      },
    })

    return NextResponse.json({ rfpId: rfp.id, rfpNumber: rfp.rfpNumber }, { status: 201 })
  } catch (e) {
    console.error('[convert-to-rfp]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
