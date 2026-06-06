import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Forestry — Custom Planter Manufacturer UAE',
  description:
    'Forestry is a UAE-based custom planter manufacturer serving interior designers, landscapers, and commercial contractors. B2B trade only. GRP, fiberglass,. Any size, any finish. 48-hour quotes.',
  alternates: { canonical: 'https://theforestry.me/about' },
  openGraph: {
    title:       'About Forestry — Custom Planter Manufacturer UAE',
    description: 'UAE-based custom planter manufacturer for B2B trade. GRP fiberglass. Any size, colour, finish. 48-hour quotes.',
    url:         'https://theforestry.me/about',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Forestry — Custom Planter Manufacturer UAE' }],
  },
}

const stats = [
  { value: '500+',  label: 'Approved trade vendors' },
  { value: '48hrs', label: 'Quote turnaround' },
  { value: '±1mm',  label: 'Manufacturing tolerance' },
  { value: '0',     label: 'Minimum order quantity' },
]

const materials = [
  {
    name: 'GRP',
    full: 'Glass-Reinforced Plastic',
    href: '/materials/grc-planters',
    desc: 'The preferred material for large outdoor installations, public realm projects, and commercial landscaping. GRP planters are UV-stable and maintain structural integrity through UAE summer temperatures. Available in any form factor including architectural-scale troughs.',
    use:  'Outdoor · Public realm · Architectural',
  },
  {
    name: 'Fiberglass',
    full: 'GRP — Glass-Reinforced Plastic',
    href: '/materials/fiberglass-planters',
    desc: 'The standard for interior commercial and hospitality installations where weight is a constraint. Fiberglass planters accept any RAL colour reference and any surface texture from gloss lacquer to stone-effect. Production tolerances are maintained at ±1mm.',
    use:  'Interior · Hospitality · High-rise',
  },
  {
    name: '
    full: 'Polymer composite',
    href: '/products',
    desc: 'Selected for detail-rich decorative forms and textured finishes. Suited to both interior and sheltered exterior installations where surface character and fine detailing are priorities.',
    use:  'Decorative · Interior · Sheltered exterior',
  },
]

const verticals = [
  'Interior designers and design firms',
  'Landscape architects and landscaping contractors',
  'Property developers — residential, hospitality, mixed-use',
  'Hotel groups and resort developers',
  'Mall operators and retail developers',
  'Government and municipal landscape projects',
  'FF&E procurement teams',
  'Facilities management companies',
]

const process = [
  { n: '01', title: 'Apply', desc: 'Submit your trade licence through the vendor access form. Approval decisions issued within 24–48 hours.' },
  { n: '02', title: 'Configure', desc: 'Set dimensions, select colour, texture, and finish via the vendor portal. Attach technical drawings in DWG or PDF format.' },
  { n: '03', title: 'Submit RFP', desc: 'Submit a request for proposal with quantities, specifications, and delivery requirements.' },
  { n: '04', title: 'Receive Quote', desc: 'A formal line-itemised quotation is delivered within 48 business hours of receiving a complete RFP.' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto">
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal-900 leading-tight mb-6 max-w-3xl">
          UAE Manufacturing,<br />
          <span className="text-terracotta">Built for Trade</span>
        </h1>
        <p className="text-xl text-charcoal-600 leading-relaxed max-w-2xl">
          Forestry is a UAE-based custom planter manufacturer supplying interior designers, landscape architects, and commercial contractors across the Emirates and GCC.
        </p>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="py-12 px-6 bg-charcoal-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-heading text-4xl font-bold text-terracotta mb-1">{s.value}</p>
              <p className="text-white/60 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
              About Forestry
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              Forestry manufactures custom planters and decorative pots for commercial and residential projects across the UAE and GCC. Every product is made to order — any size, any colour (RAL matched), any texture, any finish. There is no standard size catalogue and no minimum order quantity.
            </p>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              We supply a network of 500+ approved B2B trade vendors including interior designers, landscape architects, landscaping contractors, hotel groups, property developers, and commercial project managers. Trade licence verification is required for account approval.
            </p>
            <p className="text-charcoal-600 leading-relaxed">
              Manufacturing is based in the UAE, with supply across the Emirates and GCC and international logistics available for export projects.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
              Manufacturing Capabilities
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              Forestry maintains ±1mm dimensional tolerance across all production runs. We manufacture from a single prototype to 10,000+ unit orders on the same standards and terms — prototype quantities do not attract a premium.
            </p>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              Technical drawings in DWG, DXF, and PDF formats are accepted. Our team advises on material selection, structural considerations, and manufacturing approach during the quoting process at no additional charge.
            </p>
            <p className="text-charcoal-600 leading-relaxed">
              Surface finishes are applied and quality-checked to each client's specification before dispatch. Colour samples and prototypes for client approval are available prior to full production commitment.
            </p>
          </div>
        </div>
      </section>

      {/* ── MATERIALS ───────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">
          Materials
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {materials.map(m => (
            <Link
              key={m.name}
              href={m.href}
              className="group p-6 border border-charcoal/10 rounded-2xl hover:border-terracotta transition-all hover:shadow-md bg-white"
            >
              <div className="mb-3">
                <p className="font-heading text-xl font-bold text-charcoal-900 group-hover:text-terracotta transition-colors">{m.name}</p>
                <p className="text-xs text-charcoal/50">{m.full}</p>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed mb-4">{m.desc}</p>
              <p className="text-xs font-mono text-terracotta">{m.use}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHO WE SERVE ─────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
              Who We Work With
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-6">
              Forestry's approved vendor network includes B2B trade professionals across the UAE and GCC. A valid UAE or GCC trade licence is required for vendor account approval.
            </p>
            <div className="space-y-3">
              {verticals.map(v => (
                <div key={v} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
                  <p className="text-charcoal-700 text-sm">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
              Serving the UAE & GCC
            </h2>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              Forestry supplies designers and contractors across all Emirates — Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah, Fujairah, Ajman, and Umm Al Quwain — and across the wider GCC including Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman.
            </p>
            <p className="text-charcoal-600 leading-relaxed mb-4">
              International supply to the UK, US, Australia, and other markets is available for export projects. Contact us for international freight terms.
            </p>
            <p className="text-charcoal-600 leading-relaxed">
              All quotations are issued in AED. Alternative currencies can be discussed at the quotation stage for international orders.
            </p>
          </div>
        </div>
      </section>

      {/* ── PROCESS ──────────────────────────────────────────── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          {process.map(p => (
            <div key={p.n} className="relative">
              <p className="font-mono text-5xl font-bold text-terracotta/20 mb-3 leading-none">{p.n}</p>
              <h3 className="font-heading font-bold text-charcoal-900 mb-2">{p.title}</h3>
              <p className="text-sm text-charcoal-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-charcoal-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-4xl font-bold text-white mb-4">
            Apply for Trade Access
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            B2B trade accounts approved within 24–48 hours. Submit your trade licence and receive full access to the product catalogue and RFP portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/request-access" className="btn-primary inline-flex items-center gap-2 justify-center">
              Request Trade Access <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm">
              Browse Products
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
