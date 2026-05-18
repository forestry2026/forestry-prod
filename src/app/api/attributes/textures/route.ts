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
  sortOrder: z.number().default(0),
})

// GET /api/attributes/textures
export async function GET() {
  try {
    const textures = await prisma.texture.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ success: true, data: textures })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch textures' },
      { status: 500 }
    )
  }
}

// POST /api/attributes/textures
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = textureSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const texture = await prisma.texture.create({ data: parsed.data })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ATTRIBUTE_CREATED',
        entityType: 'Texture',
        entityId: texture.id,
        details: JSON.stringify({ name: texture.name }),
      },
    })

    return NextResponse.json({ success: true, data: texture }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create texture' },
      { status: 500 }
    )
  }
}
