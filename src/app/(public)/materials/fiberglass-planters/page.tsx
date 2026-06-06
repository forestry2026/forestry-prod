import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Fiberglass Planters UAE — Custom GRP Pots Manufacturer | Forestry',
  description:
    'Forestry manufactures custom fiberglass (GRP) planters to specification for commercial and hospitality projects across the UAE. Any size, any colour (RAL matched), any finish. B2B trade. 48-hour quotes.',
  alternates: { canonical: 'https://theforestry.me/materials/fiberglass-planters' },
  openGraph: {
    title:       'Fiberglass Planters UAE — Custom GRP Pots | Forestry',
    description: 'Custom fiberglass planters manufactured to your specification. Any size, RAL colour matching, matte or gloss finish. B2B trade. 48-hour quotes.',
    url:         'https://theforestry.me/materials/fiberglass-planters',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Custom fiberglass planters by Forestry UAE' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type':    'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What is a fiberglass planter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'A fiberglass planter (also called GRP — glass-reinforced plastic) is a decorative container for plants made from a composite of glass fibres and resin. Fiberglass planters are significantly lighter than concrete or GRP alternatives, making them ideal for interior installations, high-rise buildings, and any application where weight is a constraint.',
      },
    },
    {
      '@type': 'Question',
      name:    'Why choose fiberglass planters for UAE interior projects?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Fiberglass planters are the preferred material for UAE interior commercial and hospitality installations because they are lightweight (important in high-rise towers and podium floors), accept precise RAL colour matching, and can achieve a wide range of finishes from high-gloss lacquer to stone-effect textures. They are also resistant to humidity and UV exposure when specified for sheltered outdoor use.',
      },
    },
    {
      '@type': 'Question',
      name:    'Can fiberglass planters be custom sized?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Yes. Forestry manufactures fiberglass planters to any dimension specified by the client. There is no standard size catalogue — every piece is built to your brief with ±1mm manufacturing tolerance. Technical drawings (DWG, PDF) are accepted.',
      },
    },
    {
      '@type': 'Question',
      name:    'What finishes are available on fiberglass planters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Forestry offers matte, satin, gloss, textured, stone-effect, and metallic finishes on fiberglass planters. Any RAL colour reference is accepted for colour matching. Custom texture samples can also be matched on request.',
      },
    },
    {
      '@type': 'Question',
      name:    'What is the difference between fiberglass and GRP planters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Fiberglass and GRP (glass-reinforced plastic) are the same material — GRP is the technical term, fiberglass is the common name. All Forestry planters described as fiberglass or GRP are manufactured from a composite of glass fibres and resin.',
      },
    },
  ],
}


export default function FiberglassPlantersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-cream">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="pt-36 pb-20 px-6 max-w-5xl mx-auto">
          <div className="mb-4">
            <Link
              href="/products"
              className="text-xs font-mono text-charcoal/50 uppercase tracking-widest hover:text-terracotta transition-colors"
            >
              Materials
            </Link>
            <span className="text-xs text-charcoal/30 mx-2">/</span>
            <span className="text-xs font-mono text-charcoal/50 uppercase tracking-widest">Fiberglass Planters</span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal-900 leading-tight mb-6 max-w-3xl">
            Fiberglass Planters,<br />
            <span className="text-terracotta">Manufactured to Specification</span>
          </h1>
          <p className="text-lg text-charcoal-600 leading-relaxed max-w-2xl mb-8">
            Custom fiberglass (GRP) planters for interior designers, landscape architects, and commercial contractors across the UAE.
            Any size. Any colour. Any finish. Manufactured at ±1mm tolerance with no minimum order quantity.
          </p>
          <Link
            href="/request-access"
            className="btn-primary inline-flex items-center gap-2"
          >
            Request Trade Access <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ── WHAT IS FIBERGLASS ───────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
                What is a Fiberglass Planter?
              </h2>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Fiberglass planters — also known as GRP (glass-reinforced plastic) planters — are manufactured from a composite of woven glass fibres embedded in resin. The result is a material that is strong, lightweight, and capable of accepting virtually any surface finish or colour.
              </p>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                Fiberglass can be formed into complex geometries without significantly increasing weight — a critical advantage for upper-floor interior installations across Dubai and Abu Dhabi where strict floor-loading limits apply.
              </p>
              <p className="text-charcoal-600 leading-relaxed">
                Forestry manufactures fiberglass planters from a single prototype to 10,000+ unit production runs, maintaining ±1mm dimensional tolerance across the entire order.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Weight advantage', value: 'Lightweight — enables large-format high-rise installs' },
                { label: 'Colour accuracy',  value: 'RAL reference matching' },
                { label: 'Dimensional tolerance', value: '±1mm across all production runs' },
                { label: 'Minimum order',    value: 'None — 1 to 10,000+ units' },
                { label: 'Lead time (quote)', value: '48 business hours from complete RFP' },
              ].map(s => (
                <div key={s.label} className="flex gap-4 p-4 bg-cream rounded-xl">
                  <div className="w-1.5 h-full min-h-[2rem] bg-terracotta rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider mb-0.5">{s.label}</p>
                    <p className="text-charcoal-900 font-medium">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY FIBERGLASS FOR UAE ──────────────────────────── */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
            Why Choose Fiberglass for UAE Interior Projects?
          </h2>
          <p className="text-charcoal-600 leading-relaxed mb-6 max-w-3xl">
            The UAE construction and fit-out market has specific requirements that make fiberglass the material of choice for most interior planter specifications.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Weight for High-Rise',
                body:  'Dubai and Abu Dhabi interiors are often located on upper floors with strict floor-loading limits. Fiberglass planters weigh a fraction of concrete alternatives, enabling large-format installations that would otherwise be structurally impractical.',
              },
              {
                title: 'Colour Precision',
                body:  'Interior designers and specifiers routinely match planters to project colour palettes. Fiberglass accepts RAL references with high accuracy, ensuring the finished planter matches FF&E boards and material specifications.',
              },
              {
                title: 'Finish Versatility',
                body:  'From mirror-gloss lacquer for luxury hospitality lobbies to matte stone-effect for biophilic residential schemes — fiberglass accepts any surface treatment. Bespoke textures can also be matched from a sample.',
              },
              {
                title: 'Production Speed',
                body:  'Fiberglass tooling and production is faster than GRP for most form factors, supporting the tight project timelines common across UAE fit-out and FF&E programmes.',
              },
              {
                title: 'Humidity Resistance',
                body:  "UAE interiors — particularly hospitality, spa, and retail environments — are humid. Fiberglass is naturally resistant to moisture, preventing the cracking or staining that affects lower-quality alternatives.",
              },
              {
                title: 'Complex Geometries',
                body:  'Fiberglass can be formed into shapes and profiles that would be difficult or cost-prohibitive in GRP — curved forms, tapered profiles, and asymmetric architectural pieces are all achievable.',
              },
            ].map(c => (
              <div key={c.title} className="p-6 border border-charcoal/10 rounded-2xl">
                <h3 className="font-heading font-bold text-charcoal-900 mb-2">{c.title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── APPLICATIONS ────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">
              Applications
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Hotel lobbies, atriums, and public areas',
                'Luxury residential — villas, apartments, penthouses',
                'Retail stores and shopping mall interiors',
                'Office and corporate headquarters',
                'Restaurant and F&B interior design',
                'Spa, wellness, and leisure facilities',
                'Sheltered outdoor terraces and podiums',
                'FF&E procurement for large-scale developments',
              ].map(a => (
                <div key={a} className="flex items-start gap-3 p-4 bg-cream rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
                  <p className="text-charcoal-700">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map(q => (
                <div key={q.name} className="border-b border-charcoal/10 pb-6">
                  <h3 className="font-heading font-bold text-charcoal-900 mb-2">{q.name}</h3>
                  <p className="text-charcoal-600 leading-relaxed">{q.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-charcoal-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              Ready to Specify Fiberglass Planters?
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Apply for a B2B trade account. Approval in 24–48 hours. Access the full product catalogue and submit an RFP with your dimensions, colour references, and quantities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/request-access" className="btn-primary inline-flex items-center gap-2 justify-center">
                Request Trade Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/products" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm">
                View All Products
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
