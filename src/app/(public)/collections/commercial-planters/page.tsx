import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Commercial Planters UAE — B2B Supply for Hotels, Malls & Developers | Forestry',
  description:
    'Forestry supplies custom commercial planters to hotels, malls, developers, and contractors across the UAE. Any size, any material, any quantity. B2B trade only. 48-hour quotes.',
  alternates: { canonical: 'https://theforestry.me/collections/commercial-planters' },
  openGraph: {
    title:       'Commercial Planters UAE — Hotels, Malls & Developers | Forestry',
    description: 'Custom commercial planters for UAE projects. GRC, fiberglass, polystone. Any size. B2B trade. 48-hour quotes.',
    url:         'https://theforestry.me/collections/commercial-planters',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Commercial planters by Forestry UAE' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type':    'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What are commercial planters?',
      acceptedAnswer: { '@type': 'Answer', text: 'Commercial planters are large-scale decorative containers for plants designed for high-traffic professional environments — hotels, malls, offices, public spaces, and hospitality venues. Unlike residential planters, commercial planters are specified for durability, scale, and alignment with interior design schemes. Forestry manufactures custom commercial planters to any dimension, material, and finish for B2B trade clients across the UAE.' },
    },
    {
      '@type': 'Question',
      name:    'What materials are best for commercial planters in UAE?',
      acceptedAnswer: { '@type': 'Answer', text: 'For UAE interior commercial applications (hotels, malls, offices), fiberglass (GRP) is preferred — lightweight, precise colour matching, and wide finish range. For outdoor commercial and public realm installations, GRC (glass-reinforced concrete) is preferred — UV-stable, heat-resistant, and structurally suited to UAE summer conditions. Forestry manufactures both to any specification.' },
    },
    {
      '@type': 'Question',
      name:    'Is there a minimum order quantity for commercial planters?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Forestry has no minimum order quantity. Commercial orders from 1 unit (prototype for client approval) to 10,000+ units for large-scale projects are handled on the same standards and terms.' },
    },
    {
      '@type': 'Question',
      name:    'How do I order commercial planters for a hotel or mall project in UAE?',
      acceptedAnswer: { '@type': 'Answer', text: 'Apply for a Forestry B2B trade account at theforestry.me/request-access (trade licence required, 24–48hr approval). Then submit an RFP via the vendor portal with your dimensions, material, colour/finish reference, quantities, and delivery schedule. A formal quotation is delivered within 48 business hours.' },
    },
  ],
}

const verticals = [
  { title: 'Hotels & Resorts',      desc: 'Lobby features, poolside, exterior landscaping, spa and F&B areas. GRC and fiberglass for all environments.' },
  { title: 'Retail & Malls',        desc: 'Internal mall common areas, anchor store interiors, food court landscaping. Colour-matched to brand guidelines.' },
  { title: 'Offices & Corporate',   desc: 'Reception, atrium, meeting rooms, rooftop terraces. Lightweight fiberglass for floor-loading constraints.' },
  { title: 'Developers',            desc: 'Model apartment staging, podium landscaping, entrance features, show suites. Specification support included.' },
  { title: 'Hospitality & F&B',     desc: 'Restaurant interiors, bar environments, outdoor dining terraces. Any finish from natural stone to gloss lacquer.' },
  { title: 'Government & Municipal', desc: 'Public realm, boulevard plantings, civic plazas, park infrastructure. GRC for permanence and scale.' },
]

export default async function CommercialPlantersPage() {
  let products: Array<{ id: string; sku: string; name: string; isFeatured: boolean; images: Array<{ url: string }>; categories: Array<{ category: { name: string } }> }> = []
  try {
    products = await prisma.product.findMany({
      where:   { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take:    8,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, categories: { include: { category: true }, take: 1 } },
    })
  } catch {}

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-cream">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto">
          <div className="mb-4 text-xs font-mono text-charcoal/50 uppercase tracking-widest">Collections / Commercial Planters</div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal-900 leading-tight mb-6 max-w-3xl">
            Commercial Planters<br />
            <span className="text-terracotta">for UAE Projects</span>
          </h1>
          <p className="text-lg text-charcoal-600 leading-relaxed max-w-2xl mb-8">
            Custom planters for hotels, malls, offices, developers and contractors across the UAE.
            Any size. Any material. Any quantity. B2B trade only — formal quotation within 48 business hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/request-access" className="btn-primary inline-flex items-center gap-2">
              Request Trade Access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-charcoal/20 text-charcoal-700 hover:border-terracotta hover:text-terracotta transition-colors font-medium text-sm">
              Browse Full Catalogue
            </Link>
          </div>
        </section>

        {/* ── WHAT ARE COMMERCIAL PLANTERS ─────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">What Are Commercial Planters?</h2>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Commercial planters are decorative plant containers specified for professional environments — hotels, malls, offices, public spaces, and hospitality venues. They are designed for scale, durability, and alignment with interior design or landscape architecture schemes.
              </p>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Unlike retail stock planters, commercial planters from Forestry are manufactured to exact client specification — any dimension, any colour (RAL/Pantone matched), any texture, any finish. Technical drawings accepted. No standard size catalogue.
              </p>
              <p className="text-charcoal-600 leading-relaxed">
                Orders range from a single prototype for client approval to 10,000+ unit production runs for large-scale UAE developments — all on the same ±1mm tolerance and quality standards.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'No minimum order',       value: '1 unit to 10,000+ — same standards' },
                { label: 'Materials',              value: 'GRC (outdoor), Fiberglass (interior), Polystone' },
                { label: 'Colour matching',        value: 'Pantone & RAL references accepted' },
                { label: 'Dimensional tolerance',  value: '±1mm across all production runs' },
                { label: 'Quote turnaround',       value: '48 business hours from complete RFP' },
                { label: 'Technical drawings',     value: 'DWG, DXF, PDF accepted' },
              ].map(s => (
                <div key={s.label} className="flex gap-4 p-4 bg-cream rounded-xl">
                  <div className="w-1.5 min-h-[2rem] bg-terracotta rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-0.5">{s.label}</p>
                    <p className="text-charcoal-900 font-medium text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTORS ──────────────────────────────────────────── */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">Industries We Supply</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {verticals.map(v => (
              <div key={v.title} className="p-6 border border-charcoal/10 rounded-2xl bg-white">
                <h3 className="font-heading font-bold text-charcoal-900 mb-2">{v.title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
        {products.length > 0 && (
          <section className="py-16 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <h2 className="font-heading text-3xl font-bold text-charcoal-900">From the Catalogue</h2>
                <Link href="/products" className="text-sm font-medium text-terracotta hover:underline">View all →</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {products.map(p => (
                  <Link key={p.id} href={`/product/${p.sku}`} className="card-hover group overflow-hidden text-left">
                    <div className="aspect-[9/13] bg-gradient-to-br from-[#F0E6DA] to-[#DEC4AA] relative overflow-hidden">
                      {p.images[0]?.url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.images[0].url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : null
                      }
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-semibold text-sm text-charcoal-900 mb-2 leading-snug">{p.name}</h3>
                      <span className="text-xs font-semibold text-terracotta flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details <ArrowRight size={11} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="py-16 px-6 max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqSchema.mainEntity.map(q => (
              <div key={q.name} className="border-b border-charcoal/10 pb-6">
                <h3 className="font-heading font-bold text-charcoal-900 mb-2">{q.name}</h3>
                <p className="text-charcoal-600 leading-relaxed">{q.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-charcoal-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">Specify Commercial Planters for Your Project</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Apply for B2B trade access. Approval in 24–48 hours. Submit an RFP with your project brief, dimensions, quantities, and delivery requirements — receive a formal quotation within 48 business hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/request-access" className="btn-primary inline-flex items-center gap-2 justify-center">
                Request Trade Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections/bespoke-planters" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm">
                View Bespoke Planters
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
