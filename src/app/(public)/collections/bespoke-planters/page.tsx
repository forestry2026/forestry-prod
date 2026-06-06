import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Bespoke Planters UAE — Custom Made to Any Specification | Forestry',
  description:
    'Forestry manufactures bespoke planters to exact client specification for the UAE market. Any dimension, any material, any colour (RAL matched), any finish. No minimum order. 48-hour quotes.',
  alternates: { canonical: 'https://theforestry.me/collections/bespoke-planters' },
  openGraph: {
    title:       'Bespoke Planters UAE — Made to Your Brief | Forestry',
    description: 'Custom made planters to exact specification. Any size, colour, material, finish. No MOQ. B2B trade. 48-hour quotes.',
    url:         'https://theforestry.me/collections/bespoke-planters',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bespoke planters by Forestry UAE' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type':    'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What is a bespoke planter?',
      acceptedAnswer: { '@type': 'Answer', text: 'A bespoke planter is a decorative container for plants manufactured entirely to a client\'s specific requirements — custom dimensions, custom material, custom colour (including RAL reference matching), and custom surface finish. Bespoke planters are the opposite of off-the-shelf stock planters: every piece is made to your exact brief. Forestry manufactures bespoke planters from a single prototype to 10,000+ unit production runs.' },
    },
    {
      '@type': 'Question',
      name:    'How do I order bespoke planters in UAE?',
      acceptedAnswer: { '@type': 'Answer', text: 'Apply for a Forestry B2B trade account at theforestry.me/request-access (UAE trade licence required, approval in 24–48 hours). Once approved, submit an RFP via the vendor portal specifying your dimensions, material preference, colour reference (RAL), surface finish, quantity, and delivery requirements. A formal line-itemised quotation is delivered within 48 business hours.' },
    },
    {
      '@type': 'Question',
      name:    'Can bespoke planters be colour-matched to an interior design scheme?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Forestry accepts RAL colour references for precise matching on all orders. Clients may also supply a physical colour swatch, material sample, or paint chip for colour matching. Custom colour samples for client approval can be produced before full production commitment.' },
    },
    {
      '@type': 'Question',
      name:    'What is the minimum order for bespoke planters?',
      acceptedAnswer: { '@type': 'Answer', text: 'None. Forestry has no minimum order quantity. A single bespoke prototype is manufactured to the same standards and tolerances as a 10,000-unit production run. Single-piece orders do not attract a prototype premium.' },
    },
    {
      '@type': 'Question',
      name:    'What is the difference between bespoke planters and custom planters?',
      acceptedAnswer: { '@type': 'Answer', text: 'The terms are often used interchangeably. "Bespoke" typically implies a higher degree of customisation — made entirely to a specific brief with no standard options. "Custom" can mean selecting from pre-defined options (size, colour, finish). At Forestry, all products are bespoke: there is no standard size catalogue, no standard colour range, and no standard finish list. Every piece is made to the client\'s exact specification.' },
    },
  ],
}

const capabilities = [
  { title: 'Any Dimension',    desc: 'No size catalogue. Submit a dimension and it will be manufactured to ±1mm. From a 15cm desk piece to a 4m architectural trough.' },
  { title: 'Any Colour',       desc: 'RAL colour references accepted. Physical swatches matched. Custom colour samples produced for approval before production.' },
  { title: 'Any Finish',       desc: 'Matte, gloss, satin, textured, stone-effect, exposed aggregate, brushed, metallic. Bespoke surface treatments matched from sample.' },
  { title: 'Any Material',     desc: 'GRP fiberglass for indoor and outdoor applications.' },
  { title: 'Any Quantity',     desc: 'Single prototype or 10,000+ unit production run. No MOQ. Same quality standards and tolerances at every scale.' },
  { title: 'Any Form',         desc: 'Cylindrical, rectangular, square, conical, tapered, irregular, or fully custom architectural geometry. Technical drawings accepted.' },
]

export default async function BespokePlantersPage() {
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
          <div className="mb-4 text-xs font-mono text-charcoal/50 uppercase tracking-widest">Collections / Bespoke Planters</div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal-900 leading-tight mb-6 max-w-3xl">
            Bespoke Planters,<br />
            <span className="text-terracotta">Made to Your Brief</span>
          </h1>
          <p className="text-lg text-charcoal-600 leading-relaxed max-w-2xl mb-8">
            Every Forestry planter is bespoke — manufactured to your exact dimensions, colour, material, and finish. No standard catalogue. No standard sizes. No minimum order. Just your specification, built to ±1mm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/request-access" className="btn-primary inline-flex items-center gap-2">
              Request Trade Access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/faq" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-charcoal/20 text-charcoal-700 hover:border-terracotta hover:text-terracotta transition-colors font-medium text-sm">
              Read FAQ
            </Link>
          </div>
        </section>

        {/* ── WHAT IS BESPOKE ──────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">What is a Bespoke Planter?</h2>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                A bespoke planter is manufactured entirely to a client's specification — custom dimensions, custom material, custom colour, and custom finish. There are no standard options to select from, no fixed sizes, no pre-defined colours.
              </p>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Forestry operates exclusively in the bespoke model. Every product in our catalogue is a reference point, not a fixed stock item. Dimensions can be adjusted, proportions changed, materials switched, colours specified to any RAL reference, and surface finishes selected or matched from a sample.
              </p>
              <p className="text-charcoal-600 leading-relaxed">
                This model serves interior designers, landscape architects, and specifiers who need planters that integrate precisely with a project brief rather than compromise around what's available in a stock catalogue.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">Who Orders Bespoke?</h2>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Bespoke planter orders typically come from professionals working on specific project briefs where stock items would compromise the design intent.
              </p>
              <div className="space-y-3">
                {[
                  'Interior designers specifying FF&E for hospitality or residential projects',
                  'Landscape architects designing bespoke outdoor environments',
                  'Architects specifying structural planter features at architectural scale',
                  'Property developers staging model apartments and show suites',
                  'Design-build contractors working to client-approved specifications',
                  'Procurement teams sourcing to a design director\'s brief',
                ].map(v => (
                  <div key={v} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
                    <p className="text-charcoal-600 text-sm leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CAPABILITIES ─────────────────────────────────────── */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">Every Variable, to Specification</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map(c => (
              <div key={c.title} className="p-6 border border-charcoal/10 rounded-2xl bg-white">
                <h3 className="font-heading font-bold text-charcoal-900 mb-2">{c.title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRODUCT SAMPLE ───────────────────────────────────── */}
        {products.length > 0 && (
          <section className="py-16 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <h2 className="font-heading text-3xl font-bold text-charcoal-900">Reference Products</h2>
                <Link href="/products" className="text-sm font-medium text-terracotta hover:underline">View full catalogue →</Link>
              </div>
              <p className="text-charcoal/60 text-sm mb-6 -mt-4">All products can be adjusted to any size, colour, or finish. These are reference forms, not fixed stock items.</p>
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
            <h2 className="font-heading text-4xl font-bold text-white mb-4">Order Bespoke Planters</h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Apply for B2B trade access. Approval in 24–48 hours. Then submit your bespoke specification via the RFP portal and receive a formal quotation within 48 business hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/request-access" className="btn-primary inline-flex items-center gap-2 justify-center">
                Request Trade Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections/commercial-planters" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm">
                View Commercial Planters
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
