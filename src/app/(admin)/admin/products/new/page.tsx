import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getColors, getTextures, getFinishes, getDimensions, getCategories } from '@/lib/reference-data'
import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'New Product - Forestry Admin',
}

export default async function NewProductPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/login')
  }

  const [dimensions, colors, textures, finishes, categories] = await Promise.all([
    getDimensions(),
    getColors(),
    getTextures(),
    getFinishes(),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 hover:bg-cream rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900">Add New Product</h1>
          <p className="text-charcoal-600 mt-1">Create a new product in your catalog</p>
        </div>
      </div>

      <ProductForm
        attributes={{
          dimensions: dimensions.map(d => ({ id: d.id, name: d.name })),
          colors: colors.map(c => ({ id: c.id, name: c.name, hexCode: c.hexCode || undefined })),
          textures: textures.map(t => ({ id: t.id, name: t.name })),
          finishes: finishes.map(f => ({ id: f.id, name: f.name })),
          categories: categories.map(cat => ({ id: cat.id, name: cat.name })),
        }}
      />
    </div>
  )
}
