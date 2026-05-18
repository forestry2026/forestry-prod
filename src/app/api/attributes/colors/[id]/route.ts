import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const colorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  hexCode: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex code').optional(),
  ralCode: z.string().optional().nullable(),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
})

// PUT /api/attributes/colors/[id]
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
  const parsed = colorSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const color = await prisma.color.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_UPDATED',
        entityType: 'Color',
        entityId: color.id,
        details: JSON.stringify({ name: color.name }),
      },
    })

    return NextResponse.json({ success: true, data: color })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update color' },
      { status: 500 }
    )
  }
}

// DELETE /api/attributes/colors/[id]
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
    // First, delete all related ProductColor records
    await prisma.productColor.deleteMany({
      where: { colorId: id },
    })

    // Then delete the color
    const color = await prisma.color.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_DELETED',
        entityType: 'Color',
        entityId: color.id,
        details: JSON.stringify({ name: color.name }),
      },
    })

    return NextResponse.json({ success: true, data: color })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete color' },
      { status: 500 }
    )
  }
}
