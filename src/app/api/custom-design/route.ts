import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list vendor's own requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
    if (!vendor) return NextResponse.json({ error: 'No vendor profile' }, { status: 403 })

    const requests = await prisma.customDesignRequest.findMany({
      where:   { vendorProfileId: vendor.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (e) {
    console.error('[custom-design GET]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST — create a new custom design request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
    if (!vendor) return NextResponse.json({ error: 'No vendor profile' }, { status: 403 })

    const body = await req.json()

    const request = await prisma.customDesignRequest.create({
      data: {
        vendorProfileId:  vendor.id,
        title:            body.title,
        description:      body.description      || null,
        quantity:         Number(body.quantity)  || 1,
        colorId:          body.colorId           || null,
        textureId:        body.textureId         || null,
        finishId:         body.finishId          || null,
        customColorHex:   body.customColorHex    || null,
        customColorName:  body.customColorName   || null,
        customColorRal:   body.customColorRal    || null,
        customTexture:    body.customTexture      || null,
        customTextureUrl: body.customTextureUrl  || null,
        dimensions:       JSON.stringify(body.dimensions      ?? []),
        holesOption:      body.holesOption        || null,
        notes:            body.notes              || null,
        referenceImages:  JSON.stringify(body.referenceImages ?? []),
        status:           'pending',
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch (e) {
    console.error('[custom-design POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
