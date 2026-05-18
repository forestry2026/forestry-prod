import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { z }                         from 'zod'

const PRODUCT_INCLUDE = {
  images:     { orderBy: { sortOrder: 'asc' as const } },
  dimensions: { include: { dimension: true }, orderBy: { dimension: { sortOrder: 'asc' as const } } },
  colors:     { include: { color: true },     orderBy: { color: { sortOrder: 'asc' as const } }     },
  textures:   { include: { texture: true },   orderBy: { texture: { sortOrder: 'asc' as const } }   },
  finishes:   { include: { finish: true },    orderBy: { finish: { sortOrder: 'asc' as const } }    },
  categories: { include: { category: true },  orderBy: { category: { sortOrder: 'asc' as const } }  },
}

// GET /api/products
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)

  const category   = searchParams.get('category')
  const featured   = searchParams.get('featured') === 'true'
  const search     = searchParams.get('search') || ''
  const activeOnly = !session || session.user.role === 'VENDOR'

  const where: any = {}
  if (activeOnly)  where.isActive  = true
  if (category)    where.category  = category
  if (featured)    where.isFeatured = true
  if (search)      where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { sku:  { contains: search, mode: 'insensitive' } },
  ]

  const products = await prisma.product.findMany({
    where,
    include: PRODUCT_INCLUDE,
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
  })

  // Parse specifications for each product
  const productsWithSpecs = products.map(product => ({
    ...product,
    dimensionSpecs: product.specifications ? JSON.parse(product.specifications) : [],
  }))

  return NextResponse.json({ success: true, data: productsWithSpecs })
}

const createSchema = z.object({
  sku:          z.string().min(1),
  name:         z.string().min(1),
  description:  z.string().optional(),
  category:     z.string().optional(),
  basePrice:    z.number().optional(),
  isActive:     z.boolean().default(true),
  isFeatured:   z.boolean().default(false),
  dimensionIds: z.array(z.string()).default([]),
  colorIds:     z.array(z.string()).default([]),
  textureIds:   z.array(z.string()).default([]),
  finishIds:    z.array(z.string()).default([]),
  categoryIds:  z.array(z.string()).default([]),
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
  })).default([]),
  images:       z.array(z.object({
    url:       z.string().min(1, 'Image URL is required'),
    alt:       z.string().optional(),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().default(0),
  })).default([]),
})

// POST /api/products — admin only
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await req.json()
  console.log('API received body:', {
    imagesCount: body.images?.length || 0,
    images: body.images,
    hasImages: !!body.images
  })
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    console.error('Validation failed:', parsed.error.flatten())
    return NextResponse.json({
      error: 'Invalid input',
      details: parsed.error.flatten(),
      receivedData: {
        imagesCount: body.images?.length || 0,
        imagesList: body.images
      }
    }, { status: 400 })
  }

  const { dimensionIds, colorIds, textureIds, finishIds, categoryIds, dimensionSpecs, images, ...productData } = parsed.data

  console.log('=== PRODUCT CREATION DEBUG ===')
  console.log('Images received from client:', {
    imagesLength: images?.length,
    imageDetails: images?.map((img, idx) => ({
      index: idx,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  })

  try {
    const createData: any = {
      ...productData,
      ...(dimensionSpecs?.length > 0 && {
        specifications: JSON.stringify(dimensionSpecs),
      }),
    }

    if (images && images.length > 0) {
      console.log('Adding images to create data:')
      console.log(`  - Total images: ${images.length}`)
      images.forEach((img, idx) => {
        console.log(`  - Image ${idx + 1}: ${img.url}`)
      })
      createData.images = { createMany: { data: images } }
    } else {
      console.log('No images to create')
    }
    if (dimensionIds && dimensionIds.length > 0) {
      createData.dimensions = { createMany: { data: dimensionIds.map(id => ({ dimensionId: id })) } }
    }
    if (colorIds && colorIds.length > 0) {
      createData.colors = { createMany: { data: colorIds.map(id => ({ colorId: id })) } }
    }
    if (textureIds && textureIds.length > 0) {
      createData.textures = { createMany: { data: textureIds.map(id => ({ textureId: id })) } }
    }
    if (finishIds && finishIds.length > 0) {
      createData.finishes = { createMany: { data: finishIds.map(id => ({ finishId: id })) } }
    }
    if (categoryIds && categoryIds.length > 0) {
      createData.categories = { createMany: { data: categoryIds.map(id => ({ categoryId: id })) } }
    }

    const product = await prisma.product.create({
      data: createData,
      include: PRODUCT_INCLUDE,
    })

    console.log('Product created successfully:', {
      id: product.id,
      imagesCreated: product.images?.length || 0,
      imagesList: product.images?.map((img: any) => img.url),
    });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id, action: 'PRODUCT_CREATED',
      entityType: 'Product', entityId: product.id,
    },
  })

    // Parse specifications if they exist
    const productWithSpecs = {
      ...product,
      dimensionSpecs: product.specifications ? JSON.parse(product.specifications) : [],
    }

    return NextResponse.json({ success: true, data: productWithSpecs }, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({
      error: 'Failed to create product',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
