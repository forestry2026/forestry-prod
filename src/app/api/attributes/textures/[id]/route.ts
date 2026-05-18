import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const textureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  imageUrl: z.string().refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http'),
    'Image URL must be empty, a relative path, or absolute URL'
  ).optional().or(z.literal(null)),
  sortOrder: z.number().optional(),
})

// PUT /api/attributes/textures/[id]
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
  const parsed = textureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const texture = await prisma.texture.update({
      where: { id },
      data: parsed.data,
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_UPDATED',
        entityType: 'Texture',
        entityId: texture.id,
        details: JSON.stringify({ name: texture.name }),
      },
    })

    return NextResponse.json({ success: true, data: texture })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update texture' },
      { status: 500 }
    )
  }
}

// DELETE /api/attributes/textures/[id]
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
    // First delete all ProductTexture records
    await prisma.productTexture.deleteMany({
      where: { textureId: id },
    })

    const texture = await prisma.texture.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_DELETED',
        entityType: 'Texture',
        entityId: texture.id,
        details: JSON.stringify({ name: texture.name }),
      },
    })

    return NextResponse.json({ success: true, data: texture })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete texture' },
      { status: 500 }
    )
  }
}
