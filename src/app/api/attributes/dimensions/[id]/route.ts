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
  description: z.string().optional(),
  priceModifier: z.number().optional(),
  sortOrder: z.number().optional(),
})

// PUT /api/attributes/dimensions/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = dimensionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const dimension = await prisma.dimension.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_UPDATED',
        entityType: 'Dimension',
        entityId: dimension.id,
        details: JSON.stringify({ name: dimension.name, label: dimension.label }),
      },
    })

    return NextResponse.json({ success: true, data: dimension })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update dimension' },
      { status: 500 }
    )
  }
}

// DELETE /api/attributes/dimensions/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // First delete all ProductDimension records (cascade)
    await prisma.productDimension.deleteMany({
      where: { dimensionId: id },
    })

    const dimension = await prisma.dimension.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_DELETED',
        entityType: 'Dimension',
        entityId: id,
        details: JSON.stringify({ name: dimension.name, label: dimension.label }),
      },
    })

    return NextResponse.json({ success: true, data: dimension })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete dimension' },
      { status: 500 }
    )
  }
}
