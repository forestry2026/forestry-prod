import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  imageUrl:  z.string().min(1),
  isActive:  z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
})

export async function GET() {
  try {
    const banners = await prisma.heroBanner.findMany({ orderBy: { sortOrder: 'asc' } })
    return NextResponse.json({ success: true, data: banners })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const banner = await prisma.heroBanner.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: banner }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
