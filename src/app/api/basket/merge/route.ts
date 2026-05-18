import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorProfileId = session.user.vendorProfileId
  if (!vendorProfileId) return NextResponse.json({ error: 'No vendor profile' }, { status: 400 })

  const { items } = await req.json() as { items: any[] }
  if (!items?.length) return NextResponse.json({ success: true })

  const basket = await prisma.enquiryBasket.upsert({
    where: { vendorProfileId },
    create: { vendorProfileId },
    update: {},
  })

  await prisma.enquiryBasketItem.createMany({
    data: items.map((item: any) => ({
      basketId: basket.id,
      productId: item.productId ?? null,
      productSku: item.productSku ?? null,
      productName: item.productName,
      variantName: item.variantName ?? null,
      colorName: item.colorName ?? null,
      textureName: item.textureName ?? null,
      finishName: item.finishName ?? null,
      dimensionId: item.dimensionId ?? null,
      colorId: item.colorId ?? null,
      textureId: item.textureId ?? null,
      finishId: item.finishId ?? null,
      customWidth: item.customWidth ?? null,
      customHeight: item.customHeight ?? null,
      customDepth: item.customDepth ?? null,
      isCustom: item.isCustom ?? false,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? null,
      notes: item.notes ?? null,
    })),
  })

  return NextResponse.json({ success: true })
}
