import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'
import { ProductFilesSection } from '@/components/admin/ProductFilesSection'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Edit Product - Forestry Admin',
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/login')
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      files: true,
      dimensions: { select: { dimensionId: true } },
      colors: { select: { colorId: true } },
      textures: { select: { textureId: true } },
      finishes: { select: { finishId: true } },
      categories: { select: { categoryId: true } },
    },
  })

  if (!product) notFound()

  const [dimensions, colors, textures, finishes, categories] = await Promise.all([
    prisma.dimension.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.color.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.texture.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.finish.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  // Parse specifications from the database
  const dimensionSpecs = product.specifications
    ? JSON.parse(product.specifications)
    : []

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-cream via-white to-cream/50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-charcoal" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-charcoal">Edit Product</h1>
            <p className="text-charcoal/60 mt-2 text-lg">{product.name}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-cream-darker p-8">
          <ProductForm
            initialData={{
              id: product.id,
              sku: product.sku,
              name: product.name,
              description: product.description || undefined,
              category: product.category || undefined,
              basePrice: product.basePrice || undefined,
              isActive: product.isActive,
              isFeatured: product.isFeatured,
              dimensionIds: product.dimensions.map(d => d.dimensionId),
              colorIds: product.colors.map(c => c.colorId),
              textureIds: product.textures.map(t => t.textureId),
              finishIds: product.finishes.map(f => f.finishId),
              categoryIds: product.categories.map(c => c.categoryId),
              dimensionSpecs: dimensionSpecs,
              images: product.images.map(img => ({
                url: img.url,
                alt: img.alt || undefined,
                isPrimary: img.isPrimary,
                sortOrder: img.sortOrder,
              })),
            }}
            attributes={{
              dimensions: dimensions.map(d => ({ id: d.id, name: d.name })),
              colors: colors.map(c => ({ id: c.id, name: c.name, hexCode: c.hexCode || undefined })),
              textures: textures.map(t => ({ id: t.id, name: t.name, imageUrl: t.imageUrl ?? undefined })),
              finishes: finishes.map(f => ({ id: f.id, name: f.name })),
              categories: categories.map(cat => ({ id: cat.id, name: cat.name })),
            }}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-cream-darker p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-terracotta" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-charcoal">Product Files</h2>
              <p className="text-sm text-charcoal/50">Specification sheets, DWG drawings and PNG exports</p>
            </div>
          </div>
          <ProductFilesSection productId={product.id} />
        </div>
      </div>
    </div>
  )
}
