import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'GRC Planters UAE — Glass Reinforced Concrete Pots Manufacturer | Forestry',
  description:
    'Forestry manufactures custom GRC (glass-reinforced concrete) planters for large outdoor, architectural, and commercial installations across the UAE. Any size, UV-stable, built for UAE climate. B2B trade. 48-hour quotes.',
  alternates: { canonical: 'https://theforestry.me/materials/grc-planters' },
  openGraph: {
    title:       'GRC Planters UAE — Glass Reinforced Concrete Pots | Forestry',
    description: 'Custom GRC planters manufactured for UAE outdoor, architectural, and public realm projects. UV-stable, heat-resistant, any dimension. B2B trade. 48-hour quotes.',
    url:         'https://theforestry.me/materials/grc-planters',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Custom GRC planters by Forestry UAE' }],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type':    'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name:    'What is a GRC planter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'GRC stands for glass-reinforced concrete — a composite material made from Portland cement, aggregates, and alkali-resistant glass fibres. GRC planters are significantly lighter than standard concrete while retaining full structural integrity. They are UV-stable, weather-resistant, and the preferred material for large outdoor installations in UAE climates.',
      },
    },
    {
      '@type': 'Question',
      name:    'Why is GRC preferred for outdoor planters in the UAE?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'UAE summer temperatures regularly exceed 45°C, with intense UV radiation and occasional humidity. GRC maintains structural integrity and colour stability under these conditions where standard concrete may crack and many composites degrade. GRC planters manufactured by Forestry use alkali-resistant glass fibres that do not corrode and cement formulations selected for GCC climate performance.',
      },
    },
    {
      '@type': 'Question',
      name:    'How large can GRC planters be manufactured?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'Forestry manufactures GRC planters to any dimension. Architectural-scale troughs of 3m+ length are standard for public realm and commercial landscaping projects. Large-format geometric forms and custom architectural pieces are also produced. All dimensions are manufactured to ±1mm tolerance with technical drawings accepted in DWG and PDF format.',
      },
    },
    {
      '@type': 'Question',
      name:    'What finishes are available on GRC planters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'GRC planters from Forestry are available in matte, textured, smooth, exposed aggregate, stone-effect, and brushed finishes. Colour is matched to Pantone or RAL references. The natural character of GRC also allows for bespoke surface treatments that replicate aged concrete, basalt, or other mineral finishes.',
      },
    },
    {
      '@type': 'Question',
      name:    'What is the difference between GRC and fiberglass planters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:    'GRC is heavier and more suitable for large outdoor applications, public realm, and architectural installations where structural permanence is required. Fiberglass (GRP) is lighter and preferred for interior, hospitality, and high-rise applications. Both are custom manufactured by Forestry to any size, colour, and finish.',
      },
    },
  ],
}

const comparisonRows = [
  { prop: 'Weight',        grc: 'Heavy — structural grade',     fiber: 'Lightweight' },
  { prop: 'Best for',      grc: 'Outdoor, public realm, architectural', fiber: 'Interior, hospitality, high-rise' },
  { prop: 'UV resistance', grc: 'Excellent — full outdoor',     fiber: 'Good — sheltered outdoor' },
  { prop: 'Heat tolerance',grc: 'UAE summer — 45°C+',          fiber: 'Suitable for interior temperatures' },
  { prop: 'Colour match',  grc: 'RAL / Pantone',               fiber: 'RAL / Pantone' },
  { prop: 'Custom size',   grc: '±1mm tolerance — any dimension', fiber: '±1mm tolerance' },
]

export default function GrcPlantersPage() {
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
              href="/materials/fiberglass-planters"
              className="text-xs font-mono text-charcoal/50 uppercase tracking-widest hover:text-terracotta transition-colors"
            >
              Materials
            </Link>
            <span className="text-xs text-charcoal/30 mx-2">/</span>
            <span className="text-xs font-mono text-charcoal/50 uppercase tracking-widest">GRC Planters</span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl font-bold text-charcoal-900 leading-tight mb-6 max-w-3xl">
            GRC Planters — Architectural Scale,<br />
            <span className="text-terracotta">Built for UAE</span>
          </h1>
          <p className="text-lg text-charcoal-600 leading-relaxed max-w-2xl mb-8">
            Custom glass-reinforced concrete planters for outdoor, public realm, and large-scale commercial installations across the UAE.
            UV-stable. Heat-resistant. Any dimension. ±1mm tolerance. No minimum order.
          </p>
          <Link
            href="/request-access"
            className="btn-primary inline-flex items-center gap-2"
          >
            Request Trade Access <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* ── WHAT IS GRC ─────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
                What is GRC?
              </h2>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                GRC — glass-reinforced concrete — is a composite of Portland cement, fine aggregates, and alkali-resistant glass fibres. The glass fibre reinforcement gives GRC structural strength comparable to standard concrete at a fraction of the weight, while allowing it to be cast into complex forms that would be impractical in conventional concrete.
              </p>
              <p className="text-charcoal-600 leading-relaxed mb-4">
                In planter manufacturing, GRC is the material of choice for any application exposed to the UAE outdoor environment. Where standard concrete planters may crack under thermal cycling, fade under UV radiation, or spall in humidity, GRC maintains structural and aesthetic performance across seasons.
              </p>
              <p className="text-charcoal-600 leading-relaxed">
                Forestry manufactures GRC planters using alkali-resistant glass fibres and cement formulations selected for GCC climate conditions, across production runs from a single architectural prototype to 10,000+ units.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'UV stability',       value: 'Maintains finish in full UAE outdoor exposure' },
                { label: 'Thermal performance',value: 'Stable at 45°C+ UAE summer temperatures' },
                { label: 'Weight vs concrete', value: 'Up to 75% lighter than solid concrete equivalent' },
                { label: 'Max dimension',      value: 'Any — architectural trough to 3m+ manufactured to spec' },
                { label: 'Dimensional tolerance', value: '±1mm across all production runs' },
                { label: 'Minimum order',      value: 'None — 1 to 10,000+ units' },
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

        {/* ── WHY GRC FOR UAE ─────────────────────────────────── */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-4">
            Why GRC for UAE Outdoor Projects?
          </h2>
          <p className="text-charcoal-600 leading-relaxed mb-8 max-w-3xl">
            The UAE outdoor environment is among the most demanding in the world for landscape materials. GRC was originally developed for architectural cladding in high-performance environments — properties that translate directly to outdoor planter applications in the GCC.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'UAE Summer Performance',
                body:  'GRC planters retain structural integrity at temperatures exceeding 45°C. The alkali-resistant glass fibre reinforcement does not corrode, and cement formulations selected for Forestry production resist thermal cracking across UAE seasons.',
              },
              {
                title: 'UV Colour Stability',
                body:  'Surface finishes on GRC planters remain stable under intense UAE UV exposure. Pigments are integrated into the mix rather than applied as surface coatings, preventing the fading and peeling seen on lower-quality outdoor planters.',
              },
              {
                title: 'Structural Permanence',
                body:  'GRC planters for public realm and commercial landscaping applications are specified for permanence — they do not flex, crack, or degrade under the loads typical of large commercial installations, including soil weight and irrigation systems.',
              },
              {
                title: 'Architectural Scale',
                body:  'Large landscape installations — hotel exteriors, boulevard plantings, public squares, and development entrance features — require planters that read at architectural scale. GRC can be manufactured to any dimension while remaining manageable for site installation.',
              },
              {
                title: 'Weight Efficiency',
                body:  'Despite its structural performance, GRC is significantly lighter than solid concrete. A 2m GRC trough planter weighs a fraction of its concrete equivalent, reducing crane requirements and structural loading on podium decks.',
              },
              {
                title: 'Surface Character',
                body:  'GRC accepts a range of surface treatments that fiberglass cannot — exposed aggregate, brushed textures, stone and mineral effects, and the natural variation of architectural concrete. These finishes suit landscape and public realm contexts where a raw material aesthetic is required.',
              },
            ].map(c => (
              <div key={c.title} className="p-6 border border-charcoal/10 rounded-2xl">
                <h3 className="font-heading font-bold text-charcoal-900 mb-2">{c.title}</h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── APPLICATIONS ─────────────────────────────────────── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-8">
              Applications
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                'Hotel exteriors, courtyards, and pool surrounds',
                'Public realm — boulevards, squares, parks',
                'Commercial development entrance features',
                'Retail and mixed-use podium landscaping',
                'Resort and hospitality outdoor areas',
                'Government and municipal landscape projects',
                'Villa gardens and large residential exteriors',
                'Architectural statement planters and feature pieces',
              ].map(a => (
                <div key={a} className="flex items-start gap-3 p-4 bg-cream rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
                  <p className="text-charcoal-700">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE ────────────────────────────────── */}
        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-2">
            GRC vs Fiberglass Planters
          </h2>
          <p className="text-charcoal-600 mb-8 max-w-2xl">
            Both materials are manufactured by Forestry to the same dimensional tolerances. Selection depends on application environment and weight constraints.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-charcoal/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-charcoal-900 text-white">
                  <th className="text-left px-5 py-4 font-semibold">Property</th>
                  <th className="text-left px-5 py-4 font-semibold">GRC</th>
                  <th className="text-left px-5 py-4 font-semibold">Fiberglass (GRP)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.prop} className={i % 2 === 0 ? 'bg-white' : 'bg-cream'}>
                    <td className="px-5 py-4 font-semibold text-charcoal-900">{row.prop}</td>
                    <td className="px-5 py-4 text-charcoal-700">{row.grc}</td>
                    <td className="px-5 py-4 text-charcoal-700">{row.fiber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-charcoal/50">
            Specifying both interior and exterior?{' '}
            <Link href="/request-access" className="text-terracotta hover:underline font-medium">
              Contact us — mixed-material orders are handled in a single RFP.
            </Link>
          </p>
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
              Specify GRC Planters for Your Project
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Apply for B2B trade access. Approval in 24–48 hours. Submit an RFP with your dimensions, quantities, surface finish, and installation context — we advise on specification as part of the quoting process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/request-access" className="btn-primary inline-flex items-center gap-2 justify-center">
                Request Trade Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/materials/fiberglass-planters" className="inline-flex items-center gap-2 justify-center px-6 py-3 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors font-medium text-sm">
                View Fiberglass Planters
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
