import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const slideSchema = z.object({
  imageUrl:  z.string().min(1),
  headline:  z.string().min(1),
  subtext:   z.string().optional().nullable(),
  isActive:  z.boolean().optional().default(true),
  sortOrder: z.number().optional().default(0),
})

// GET — public (used by login page)
export async function GET() {
  try {
    const slides = await prisma.loginSlide.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: slides })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}

// POST — admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body   = await req.json()
    const parsed = slideSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

    const slide = await prisma.loginSlide.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: slide }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
