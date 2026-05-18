import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/products/[id]/duplicate
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const source = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        colors: true,
        textures: true,
        finishes: true,
        dimensions: true,
        categories: true,
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate a unique SKU suffix
    const suffix = Date.now().toString(36).toUpperCase().slice(-4)
    const newSku = `${source.sku}-COPY-${suffix}`

    const copy = await prisma.product.create({
      data: {
        sku: newSku,
        name: `Copy of ${source.name}`,
        description: source.description,
        category: source.category,
        basePrice: source.basePrice,
        specifications: source.specifications,
        isActive: false,   // drafts by default so admin reviews before publishing
        isFeatured: false,
        images: {
          createMany: {
            data: source.images.map((img, idx) => ({
              url: img.url,
              alt: img.alt,
              isPrimary: img.isPrimary,
              sortOrder: idx,
            })),
          },
        },
        colors: {
          createMany: { data: source.colors.map(r => ({ colorId: r.colorId })) },
        },
        textures: {
          createMany: { data: source.textures.map(r => ({ textureId: r.textureId })) },
        },
        finishes: {
          createMany: { data: source.finishes.map(r => ({ finishId: r.finishId })) },
        },
        dimensions: {
          createMany: { data: source.dimensions.map(r => ({ dimensionId: r.dimensionId })) },
        },
        categories: {
          createMany: { data: source.categories.map(r => ({ categoryId: r.categoryId })) },
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRODUCT_DUPLICATED',
        entityType: 'Product',
        entityId: copy.id,
        details: JSON.stringify({ sourceId: id, sourceName: source.name }),
      },
    })

    return NextResponse.json({ success: true, data: { id: copy.id } }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate product' },
      { status: 500 }
    )
  }
}
