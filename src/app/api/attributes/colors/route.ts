import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const colorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hexCode: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex code').optional(),
  ralCode: z.string().optional().nullable(),
  priceModifier: z.number().optional(),
  sortOrder: z.number().default(0),
})

// GET /api/attributes/colors
export async function GET() {
  try {
    const colors = await prisma.color.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: colors })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch colors' },
      { status: 500 }
    )
  }
}

// POST /api/attributes/colors
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = colorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const color = await prisma.color.create({ data: parsed.data })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_CREATED',
        entityType: 'Color',
        entityId: color.id,
        details: JSON.stringify({ name: color.name }),
      },
    })

    return NextResponse.json({ success: true, data: color }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create color' },
      { status: 500 }
    )
  }
}
