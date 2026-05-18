import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  sku: z.string().min(1).optional().or(z.literal('')),
  name: z.string().min(1).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  basePrice: z.number().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  dimensionIds: z.array(z.string()).optional(),
  colorIds: z.array(z.string()).optional(),
  textureIds: z.array(z.string()).optional(),
  finishIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  dimensionSpecs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specifications: z.array(z.object({
      id: z.string(),
      name: z.string(),
      value: z.union([z.number(), z.null()]).optional(),
      unit: z.string(),
    })).default([]),
    price: z.union([z.number(), z.null()]).optional(),
  })).optional(),
  images: z.array(z.object({
    url: z.string().min(1),
    alt: z.string().optional().or(z.literal('')),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().default(0),
  })).default([]).optional(),
})

// PATCH /api/products/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { dimensionIds, colorIds, textureIds, finishIds, categoryIds, dimensionSpecs, images, ...rawProductData } = parsed.data

    // Clean up empty strings - convert them to undefined so Prisma doesn't update those fields
    const productData = Object.fromEntries(
      Object.entries(rawProductData).map(([key, value]) => [
        key,
        value === '' ? undefined : value,
      ])
    ) as typeof rawProductData

    // Get existing product to compare images
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Handle image updates
    let imageOperations = {}
    if (images) {
      const existingImageUrls = existingProduct.images.map(img => img.url)
      const newImageUrls = images.map(img => img.url)

      // Find images to delete (exist in DB but not in new array)
      const imagesToDelete = existingProduct.images
        .filter(img => !newImageUrls.includes(img.url))
        .map(img => img.id)

      // Find new images to create (exist in new array but not in DB)
      const imagesToCreate = images.filter(img => !existingImageUrls.includes(img.url))

      // Build image update operations
      if (imagesToDelete.length > 0) {
        imageOperations = {
          images: {
            deleteMany: {
              id: { in: imagesToDelete },
            },
            ...( imagesToCreate.length > 0 && {
              createMany: {
                data: imagesToCreate.map((img, idx) => ({
                  url: img.url,
                  alt: img.alt || '',
                  isPrimary: img.isPrimary,
                  sortOrder: existingProduct.images.length - imagesToDelete.length + idx,
                })),
              },
            }),
          },
        }
      } else if (imagesToCreate.length > 0) {
        imageOperations = {
          images: {
            createMany: {
              data: imagesToCreate.map((img, idx) => ({
                url: img.url,
                alt: img.alt || '',
                isPrimary: img.isPrimary,
                sortOrder: existingProduct.images.length + idx,
              })),
            },
          },
        }
      }

      // Handle isPrimary updates for existing images
      if (images.length > 0) {
        for (const img of images) {
          const existingImage = existingProduct.images.find(ei => ei.url === img.url)
          if (existingImage && existingImage.isPrimary !== img.isPrimary) {
            await prisma.productImage.update({
              where: { id: existingImage.id },
              data: { isPrimary: img.isPrimary },
            })
          }
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(dimensionSpecs && {
          specifications: JSON.stringify(dimensionSpecs),
        }),
        ...imageOperations,
        ...(dimensionIds && {
          dimensions: {
            deleteMany: {},
            createMany: { data: dimensionIds.map(id => ({ dimensionId: id })) },
          },
        }),
        ...(colorIds && {
          colors: {
            deleteMany: {},
            createMany: { data: colorIds.map(id => ({ colorId: id })) },
          },
        }),
        ...(textureIds && {
          textures: {
            deleteMany: {},
            createMany: { data: textureIds.map(id => ({ textureId: id })) },
          },
        }),
        ...(finishIds && {
          finishes: {
            deleteMany: {},
            createMany: { data: finishIds.map(id => ({ finishId: id })) },
          },
        }),
        ...(categoryIds && {
          categories: {
            deleteMany: {},
            createMany: { data: categoryIds.map(id => ({ categoryId: id })) },
          },
        }),
      },
      include: {
        images: true,
        dimensions: { include: { dimension: true } },
        colors: { include: { color: true } },
        textures: { include: { texture: true } },
        finishes: { include: { finish: true } },
        categories: { include: { category: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRODUCT_UPDATED',
        entityType: 'Product',
        entityId: product.id,
        details: JSON.stringify({ changedFields: Object.keys(productData) }),
      },
    })

    // Parse specifications JSON if it exists
    const productWithSpecs = {
      ...product,
      dimensionSpecs: product.specifications ? JSON.parse(product.specifications) : [],
    }

    return NextResponse.json({ success: true, data: productWithSpecs })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // RfpItem has no onDelete: Cascade — delete them first to avoid FK constraint
    await prisma.rfpItem.deleteMany({ where: { productId: id } })

    const product = await prisma.product.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PRODUCT_DELETED',
        entityType: 'Product',
        entityId: id,
        details: JSON.stringify({ productName: product.name }),
      },
    })

    return NextResponse.json({ success: true, message: 'Product deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        dimensions: { include: { dimension: true } },
        colors: { include: { color: true } },
        textures: { include: { texture: true } },
        finishes: { include: { finish: true } },
        categories: { include: { category: true } },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Parse specifications JSON if it exists
    const productWithSpecs = {
      ...product,
      dimensionSpecs: product.specifications ? JSON.parse(product.specifications) : [],
    }

    return NextResponse.json({ success: true, data: productWithSpecs })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
