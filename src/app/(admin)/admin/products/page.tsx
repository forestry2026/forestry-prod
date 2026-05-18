import Link              from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect }        from 'next/navigation'
import { authOptions }     from '@/lib/auth'
import { prisma }          from '@/lib/prisma'
import { Plus }            from 'lucide-react'
import { ProductsListContent } from '@/components/admin/ProductsListContent'
import { parsePermissions, canAccess, canEdit } from '@/lib/portal-permissions'

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec  = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'products')) redirect('/admin')
  const readonly  = !canEdit(session.user.role, userPerms, 'products')

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        colors:     { include: { color:     true } },
        dimensions: { include: { dimension: true } },
        textures:   { include: { texture:   true } },
        finishes:   { include: { finish:    true } },
        categories: { include: { category:  true } },
        images: true,
        files:  true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select:  { id: true, name: true },
    }),
  ])

  const totalCount    = products.length
  const activeCount   = products.filter(p => p.isActive).length
  const featuredCount = products.filter(p => p.isFeatured).length

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Products</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">Manage your product catalog</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{totalCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
          </div>
          {activeCount > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-sage/10 border border-sage/20">
              <span className="font-heading text-2xl font-bold text-sage-600 leading-none">{activeCount}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-600/70 mt-0.5">Active</span>
            </div>
          )}
          {featuredCount > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <span className="font-heading text-2xl font-bold text-amber-700 leading-none">{featuredCount}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 mt-0.5">Featured</span>
            </div>
          )}
          {!readonly && (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          )}
        </div>
      </div>

      <ProductsListContent products={products} categories={categories} readonly={readonly} />
    </div>
  )
}
