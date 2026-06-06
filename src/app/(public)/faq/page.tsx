import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Custom Planters FAQ — Lead Times, MOQ, Materials | Forestry UAE',
  description:
    'Answers to the most common questions about ordering custom planters from Forestry UAE. Lead times, minimum order quantity, materials, colour matching, trade access, and more.',
  alternates: { canonical: 'https://theforestry.me/faq' },
  openGraph: {
    title:       'Custom Planters FAQ | Forestry UAE',
    description: 'Common questions about custom planter orders — lead times, MOQ, GRC vs fiberglass, colour matching, and how to become an approved vendor.',
    url:         'https://theforestry.me/faq',
    type:        'website',
    siteName:    'Forestry',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Forestry UAE — Custom Planters FAQ' }],
  },
}

const faqs = [
  {
    category: 'Ordering & Trade Access',
    items: [
      {
        q: 'Who can buy from Forestry?',
        a: 'Forestry is a B2B trade supplier. Approved customers include interior designers, landscape architects, landscaping contractors, property developers, hotel groups, retail operators, facilities management companies, and commercial project managers across the UAE and GCC. Retail purchases are not available.',
      },
      {
        q: 'How do I become an approved vendor?',
        a: 'Submit your trade licence through the vendor access form at theforestry.me/request-access. Our team reviews applications and issues approval decisions within 24–48 hours. Once approved, you receive full access to the product catalogue and the RFP portal.',
      },
      {
        q: 'Is there a minimum order quantity?',
        a: 'No. Forestry has no minimum order quantity. We manufacture from a single prototype up to 10,000+ units on the same standards, tolerances, and terms. Single-piece prototypes are produced at the same quality level as full production runs.',
      },
      {
        q: 'How do I submit an order or request a quote?',
        a: 'Once approved as a vendor, you access the RFP (request for proposal) portal. Configure your planter dimensions, select colour and finish, attach any technical drawings or reference images, specify quantities and delivery requirements, and submit the RFP. We return a formal line-itemised quotation within 48 business hours.',
      },
    ],
  },
  {
    category: 'Lead Times & Delivery',
    items: [
      {
        q: 'How long does it take to receive a quotation?',
        a: 'Forestry delivers a formal line-itemised quotation within 48 business hours of receiving a complete RFP. A complete RFP includes dimensions, material selection, colour/finish reference, quantity, and delivery requirements. Incomplete RFPs may require clarification before the clock starts.',
      },
      {
        q: 'What is the production lead time for custom planters?',
        a: 'Production lead time depends on order size, material, and current production schedule. Lead times are confirmed in your formal quotation. As a general guide, small orders of 1–10 units are typically completed faster than large production runs. We advise submitting RFPs as early as possible in your project programme.',
      },
      {
        q: 'Does Forestry supply outside the UAE?',
        a: 'Yes. Forestry supplies designers and contractors across the GCC including Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman. International supply to the UK, US, Australia, and other markets is available. Contact us for international freight terms and lead times.',
      },
    ],
  },
  {
    category: 'Materials',
    items: [
      {
        q: 'What materials are Forestry planters made from?',
        a: 'Forestry manufactures planters in three primary materials: GRC (glass-reinforced concrete), preferred for large outdoor, public realm, and architectural installations; fiberglass (GRP), preferred for interior commercial and hospitality applications; and polystone, selected for decorative and detail-rich forms.',
      },
      {
        q: 'What is a GRC planter?',
        a: 'GRC stands for glass-reinforced concrete — a composite of Portland cement and alkali-resistant glass fibres. GRC planters are UV-stable, heat-resistant, and structurally sound in full UAE outdoor conditions including summer temperatures above 45°C. They are lighter than solid concrete while retaining comparable structural performance.',
      },
      {
        q: 'What is a fiberglass planter?',
        a: 'A fiberglass planter (GRP — glass-reinforced plastic) is made from a composite of glass fibres and resin. Fiberglass planters are significantly lighter than GRC, making them the preferred material for interior, hospitality, and upper-floor applications. They accept a wide range of finishes and precise Pantone/RAL colour matching.',
      },
      {
        q: 'How do I choose between GRC and fiberglass?',
        a: 'Choose GRC for outdoor applications, large-scale landscaping, public realm, and any installation exposed to the UAE climate. Choose fiberglass for interior commercial, hospitality, and high-rise applications where weight is a constraint. Both materials are manufactured by Forestry to identical dimensional tolerances and colour matching standards.',
      },
    ],
  },
  {
    category: 'Dimensions, Colour & Finish',
    items: [
      {
        q: 'Can planters be manufactured to a custom size?',
        a: 'Yes. Forestry manufactures planters to any dimension specified by the client. There is no standard size catalogue — every piece is manufactured to your brief. Technical drawings in DWG and PDF format are accepted. All production is held to ±1mm dimensional tolerance.',
      },
      {
        q: 'Can custom planters be colour-matched to a Pantone or RAL code?',
        a: 'Yes. Forestry accepts Pantone and RAL colour references for precise matching on all orders across all materials. Clients may also supply a physical colour swatch or sample for matching. Custom colour samples can be produced for approval before full production.',
      },
      {
        q: 'What surface finishes are available?',
        a: 'Available finishes include matte, satin, gloss, textured, stone-effect, exposed aggregate, brushed, and metallic. GRC and fiberglass support different finish options based on material properties. Bespoke surface treatments can be matched from a client-supplied sample on request.',
      },
      {
        q: 'What manufacturing tolerance does Forestry maintain?',
        a: 'Forestry maintains ±1mm dimensional tolerance across all products, from single prototypes to large production runs. All pieces are manufactured to the exact dimensions specified by the client.',
      },
    ],
  },
  {
    category: 'Technical & Process',
    items: [
      {
        q: 'Can I submit technical drawings with my RFP?',
        a: 'Yes. Technical drawings in DWG, DXF, and PDF formats are accepted as part of the RFP process. Submitting drawings ensures dimensional accuracy and typically speeds up quotation. Forestry\'s team can also advise on structural or manufacturing considerations during the quotation process.',
      },
      {
        q: 'Can Forestry produce prototypes before a full production run?',
        a: 'Yes. Single-unit prototypes are manufactured to the same standards and tolerances as full production runs. Many clients commission a prototype for client approval or site testing before placing a full production order. There is no minimum order quantity.',
      },
      {
        q: 'Does Forestry provide product documentation?',
        a: 'Yes. Approved vendors can download PDF product specifications and technical drawing files from the vendor portal for each product in the catalogue. Custom documentation for bespoke orders is included in the quotation process.',
      },
    ],
  },
]

const schemaFaqs = faqs.flatMap(cat =>
  cat.items.map(item => ({
    '@type':          'Question',
    name:             item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }))
)

const faqSchema = {
  '@context':  'https://schema.org',
  '@type':     'FAQPage',
  mainEntity:  schemaFaqs,
}

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-cream">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="pt-36 pb-16 px-6 max-w-4xl mx-auto">
          <h1 className="font-heading text-5xl font-bold text-charcoal-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-charcoal-600 leading-relaxed max-w-2xl">
            Common questions about ordering custom planters from Forestry — trade access, lead times, materials, sizing, and colour matching.
          </p>
        </section>

        {/* ── FAQ CONTENT ──────────────────────────────────────── */}
        <section className="pb-20 px-6 max-w-4xl mx-auto">
          <div className="space-y-16">
            {faqs.map(cat => (
              <div key={cat.category}>
                <h2 className="font-heading text-2xl font-bold text-charcoal-900 mb-6 pb-3 border-b border-charcoal/10">
                  {cat.category}
                </h2>
                <div className="space-y-8">
                  {cat.items.map(item => (
                    <div key={item.q} id={item.q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}>
                      <h3 className="font-heading font-bold text-charcoal-900 text-lg mb-2">
                        {item.q}
                      </h3>
                      <p className="text-charcoal-600 leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── MATERIAL LINKS ───────────────────────────────────── */}
        <section className="py-12 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-charcoal/60 text-sm mb-4 font-medium uppercase tracking-wider">Material guides</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/materials/fiberglass-planters"
                className="flex-1 p-5 border border-charcoal/10 rounded-2xl hover:border-terracotta hover:bg-terracotta/5 transition-all group"
              >
                <p className="font-heading font-bold text-charcoal-900 mb-1 group-hover:text-terracotta">Fiberglass Planters →</p>
                <p className="text-sm text-charcoal/60">Interior, hospitality, high-rise applications</p>
              </Link>
              <Link
                href="/materials/grc-planters"
                className="flex-1 p-5 border border-charcoal/10 rounded-2xl hover:border-terracotta hover:bg-terracotta/5 transition-all group"
              >
                <p className="font-heading font-bold text-charcoal-900 mb-1 group-hover:text-terracotta">GRC Planters →</p>
                <p className="text-sm text-charcoal/60">Outdoor, architectural, public realm</p>
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
            <p className="text-white/70 mb-8">
              Apply for a B2B trade account. Approval in 24–48 hours. Then submit your first RFP and receive a formal quotation within 48 business hours.
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
