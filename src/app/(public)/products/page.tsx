import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Custom Planters — Full Collection | Forestry UAE',
  description:
    'Browse the full Forestry catalogue of custom planters and bespoke pots for B2B trade clients in the UAE. Fiberglass, GRP, and polystone. Any size, colour, and finish. Apply for trade access to request a quote.',
  alternates: { canonical: 'https://theforestry.me/products' },
  openGraph: {
    title:       'Custom Planters — Full Collection | Forestry UAE',
    description: 'Full catalogue of custom planters. Fiberglass, GRP, polystone. Any size, colour, finish. B2B trade. 48-hour quotes.',
    url:         'https://theforestry.me/products',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Custom planters by Forestry UAE' }],
  },
}

function MiniPot() {
  return (
    <div className="relative">
      <div className="absolute -top-2.5 -left-3 -right-3 h-5 bg-gradient-to-r from-[#C4683A] to-[#B35C2A] rounded-sm" />
      <div className="w-16 h-24 bg-gradient-to-br from-[#C4683A] via-[#B35C2A] to-[#8B4520] rounded-b-xl shadow-lg" />
    </div>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  // Fetch all active products
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category
        ? {
            categories: {
              some: { category: { name: { equals: category, mode: 'insensitive' } } },
            },
          }
        : {}),
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    include: {
      images:     { orderBy: { sortOrder: 'asc' }, take: 1 },
      categories: { include: { category: true }, take: 1 },
    },
  })

  // Fetch all categories for filter
  const categories = await prisma.category.findMany({
    where:   { products: { some: { product: { isActive: true } } } },
    orderBy: { name: 'asc' },
  })

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type':    'ItemList',
    name:       'Forestry Custom Planters — Full Collection',
    description: 'Custom planters and bespoke pots available for B2B trade order in the UAE',
    url:        'https://theforestry.me/products',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type':    'ListItem',
      position:   i + 1,
      url:        `https://theforestry.me/product/${p.sku}`,
      name:       p.name,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen bg-cream">

        {/* ── HEADER ──────────────────────────────────────────── */}
        <section className="pt-36 pb-10 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="font-heading text-5xl font-bold text-charcoal-900 mb-3">
                Custom Planters
              </h1>
              <p className="text-charcoal-600 max-w-xl leading-relaxed">
                Every piece manufactured to specification. Any size, colour, texture, and finish.
                B2B trade only — <Link href="/request-access" className="text-terracotta hover:underline font-medium">apply for access</Link> to view pricing and submit an RFP.
              </p>
            </div>
            <p className="text-sm text-charcoal/50 font-mono flex-shrink-0">
              {products.length} {products.length === 1 ? 'product' : 'products'}
              {category ? ` · ${category}` : ''}
            </p>
          </div>
        </section>

        {/* ── CATEGORY FILTER ─────────────────────────────────── */}
        {categories.length > 0 && (
          <section className="px-6 max-w-7xl mx-auto pb-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/products"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !category
                    ? 'bg-charcoal-900 text-white'
                    : 'bg-white border border-charcoal/15 text-charcoal-700 hover:border-terracotta hover:text-terracotta'
                }`}
              >
                All
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    category?.toLowerCase() === cat.name.toLowerCase()
                      ? 'bg-charcoal-900 text-white'
                      : 'bg-white border border-charcoal/15 text-charcoal-700 hover:border-terracotta hover:text-terracotta'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── PRODUCT GRID ────────────────────────────────────── */}
        <section className="px-6 max-w-7xl mx-auto pb-20">
          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-charcoal/50 text-lg">No products found{category ? ` in "${category}"` : ''}.</p>
              {category && (
                <Link href="/products" className="mt-4 inline-block text-terracotta hover:underline font-medium">
                  View all products →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(product => {
                const imageUrl   = product.images[0]?.url ?? null
                const catName    = product.categories[0]?.category?.name ?? null
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.sku}`}
                    className="card-hover group overflow-hidden text-left"
                    aria-label={`View details for ${product.name}`}
                  >
                    {/* Image */}
                    <div className="aspect-[9/13] bg-gradient-to-br from-[#F0E6DA] to-[#DEC4AA] relative overflow-hidden">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-end justify-center pb-5">
                          <MiniPot />
                        </div>
                      )}
                      {product.isFeatured && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-terracotta text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      {catName && (
                        <span className="badge-sage text-[11px] mb-2">{catName}</span>
                      )}
                      <h2 className="font-heading font-semibold text-sm text-charcoal-900 mb-3 leading-snug">
                        {product.name}
                      </h2>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-terracotta group-hover:gap-3 transition-all duration-200">
                        View Details
                        <ArrowRight size={13} aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ── MATERIALS STRIP ─────────────────────────────────── */}
        <section className="py-12 px-6 bg-white border-t border-charcoal/10">
          <div className="max-w-7xl mx-auto">
            <p className="text-charcoal/50 text-xs font-mono uppercase tracking-widest mb-5">Material guides</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/materials/fiberglass-planters" className="flex-1 p-5 border border-charcoal/10 rounded-2xl hover:border-terracotta hover:bg-terracotta/5 transition-all group">
                <p className="font-heading font-bold text-charcoal-900 mb-1 group-hover:text-terracotta">Fiberglass Planters →</p>
                <p className="text-sm text-charcoal/60">Interior, hospitality, high-rise</p>
              </Link>
              <Link href="/materials/grc-planters" className="flex-1 p-5 border border-charcoal/10 rounded-2xl hover:border-terracotta hover:bg-terracotta/5 transition-all group">
                <p className="font-heading font-bold text-charcoal-900 mb-1 group-hover:text-terracotta">GRP Planters →</p>
                <p className="text-sm text-charcoal/60">Outdoor, architectural, public realm</p>
              </Link>
              <Link href="/faq" className="flex-1 p-5 border border-charcoal/10 rounded-2xl hover:border-terracotta hover:bg-terracotta/5 transition-all group">
                <p className="font-heading font-bold text-charcoal-900 mb-1 group-hover:text-terracotta">FAQ →</p>
                <p className="text-sm text-charcoal/60">Lead times, MOQ, colour matching</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-charcoal-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              Ready to Order?
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Apply for a B2B trade account. Approval in 24–48 hours. Then configure your planter to specification and submit an RFP — receive a formal quotation within 48 business hours.
            </p>
            <Link href="/request-access" className="btn-primary inline-flex items-center gap-2">
              Request Trade Access <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </>
  )
}
