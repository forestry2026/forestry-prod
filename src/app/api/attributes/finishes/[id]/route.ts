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
  sortOrder: z.number().optional(),
})

// PUT /api/attributes/finishes/[id]
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
  const parsed = finishSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const finish = await prisma.finish.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_UPDATED',
        entityType: 'Finish',
        entityId: finish.id,
        details: JSON.stringify({ name: finish.name }),
      },
    })

    return NextResponse.json({ success: true, data: finish })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update finish' },
      { status: 500 }
    )
  }
}

// DELETE /api/attributes/finishes/[id]
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
    // Delete all product-finish relationships first (cascade)
    await prisma.productFinish.deleteMany({
      where: { finishId: id },
    })

    const finish = await prisma.finish.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_DELETED',
        entityType: 'Finish',
        entityId: id,
        details: JSON.stringify({ name: finish.name }),
      },
    })

    return NextResponse.json({ success: true, data: finish })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete finish' },
      { status: 500 }
    )
  }
}
