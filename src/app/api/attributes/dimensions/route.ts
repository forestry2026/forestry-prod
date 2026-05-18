import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const dimensionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  label: z.string().min(1, 'Label is required'),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  priceModifier: z.number().optional(),
  sortOrder: z.number().default(0),
})

// GET /api/attributes/dimensions
export async function GET() {
  try {
    const dimensions = await prisma.dimension.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: dimensions })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dimensions' },
      { status: 500 }
    )
  }
}

// POST /api/attributes/dimensions
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = dimensionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const dimension = await prisma.dimension.create({ data: parsed.data })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_CREATED',
        entityType: 'Dimension',
        entityId: dimension.id,
        details: JSON.stringify({ name: dimension.name, label: dimension.label }),
      },
    })

    return NextResponse.json({ success: true, data: dimension }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create dimension' },
      { status: 500 }
    )
  }
}
