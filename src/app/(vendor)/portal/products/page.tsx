import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProductsCatalogueClient from './products-client'

export const metadata: Metadata = {
  title: 'Products - Forestry Vendor Portal',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') {
    redirect('/login')
  }

  const params = await searchParams
  const categoryId = (params.category as string) || ''
  const search = (params.search as string) || ''

  // Base filter — only active products visible in the vendor catalogue
  const where: any = { isActive: true }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ]
  }
  if (categoryId) {
    where.categories = { some: { categoryId } }
  }

  // Mirror admin's query shape so vendors see the same live data
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: true,
        dimensions: { include: { dimension: true } },
        colors: { include: { color: true } },
        textures: { include: { texture: true } },
        finishes: { include: { finish: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <ProductsCatalogueClient
      products={products as any}
      categories={categories}
      initialSearch={search}
      initialCategoryId={categoryId}
    />
  )
}
