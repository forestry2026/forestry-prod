import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorProfileId = session.user.vendorProfileId
  if (!vendorProfileId) return NextResponse.json({ data: [] })

  const basket = await prisma.enquiryBasket.findUnique({
    where: { vendorProfileId },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({ data: basket?.items ?? [] })
}
