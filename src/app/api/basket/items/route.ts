import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorProfileId = session.user.vendorProfileId
  if (!vendorProfileId) return NextResponse.json({ error: 'No vendor profile' }, { status: 400 })

  const body = await req.json()

  // Upsert basket first
  const basket = await prisma.enquiryBasket.upsert({
    where: { vendorProfileId },
    create: { vendorProfileId },
    update: {},
  })

  const item = await prisma.enquiryBasketItem.create({
    data: {
      basketId: basket.id,
      productId: body.productId ?? null,
      productSku: body.productSku ?? null,
      productName: body.productName,
      variantName: body.variantName ?? null,
      colorName: body.colorName ?? null,
      textureName: body.textureName ?? null,
      finishName: body.finishName ?? null,
      dimensionId: body.dimensionId ?? null,
      colorId: body.colorId ?? null,
      textureId: body.textureId ?? null,
      finishId: body.finishId ?? null,
      customWidth: body.customWidth ?? null,
      customHeight: body.customHeight ?? null,
      customDepth: body.customDepth ?? null,
      isCustom: body.isCustom ?? false,
      quantity: body.quantity ?? 1,
      unitPrice: body.unitPrice ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json({ data: item }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  await prisma.enquiryBasketItem.deleteMany({
    where: { id: itemId, basket: { vendorProfileId: session.user.vendorProfileId! } },
  })

  return NextResponse.json({ success: true })
}
