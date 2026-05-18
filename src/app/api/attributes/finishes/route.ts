import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const finishSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http'),
    'Image URL must be empty, a relative path, or absolute URL'
  ).optional().or(z.literal(null)),
  priceModifier: z.number().optional(),
  sortOrder: z.number().default(0),
})

// GET /api/attributes/finishes
export async function GET() {
  try {
    const finishes = await prisma.finish.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: finishes })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch finishes' },
      { status: 500 }
    )
  }
}

// POST /api/attributes/finishes
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = finishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const finish = await prisma.finish.create({ data: parsed.data })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_CREATED',
        entityType: 'Finish',
        entityId: finish.id,
        details: JSON.stringify({ name: finish.name }),
      },
    })

    return NextResponse.json({ success: true, data: finish }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create finish' },
      { status: 500 }
    )
  }
}
