import Link from 'next/link'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ProductCarousel } from './ProductCarousel'

/* ── Editorial content ─────────────────────────────────────────── */
const STEPS = [
  { n: '01', title: 'Apply',     desc: 'Submit your trade licence. Approval in 24–48 hours.' },
  { n: '02', title: 'Configure', desc: 'Set dimensions. Pick colour, texture, finish.'        },
  { n: '03', title: 'Submit',    desc: 'Attach drawings, quantities, delivery dates.'          },
  { n: '04', title: 'Quote',     desc: 'Line-itemised quotation. Delivered in 48 hours.'      },
]

const CAPABILITIES = [
  { n: '01', title: '1 to 10,000 units',          desc: 'Single prototype or production run. Same line.'      },
  { n: '02', title: '±1mm tolerance',             desc: 'Manufactured to the millimetre. No rounding.'         },
  { n: '03', title: 'Colour · Texture · Finish', desc: 'Pick from the catalogue. Or send a Pantone or RAL reference code.' },
]

/* ── Page ───────────────────────────────────────────────────────── */
export default async function LandingPage() {
  // Hero banner — dedicated HeroBanner table
  const heroBanners = await prisma.heroBanner.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: 'asc' },
    take:    1,
  })
  const heroSlide = heroBanners[0] ?? null

  // Featured products
  let products = await prisma.product.findMany({
    where:   { isActive: true, isFeatured: true },
    orderBy: { createdAt: 'desc' },
    take:    8,
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, categories: { include: { category: true }, take: 1 } },
  })
  if (products.length === 0) {
    products = await prisma.product.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: 'desc' },
      take:    8,
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, categories: { include: { category: true }, take: 1 } },
    })
  }

  // Quarterly issue label — Jan/Feb/Mar → "JANUARY", Apr/May/Jun → "APRIL", etc.
  const issueLabel = (() => {
    const now = new Date()
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    return `Vol. 01 · ${qStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}`
  })()

  // Dynamic CTA — "Quote on {day}" computed as today + 4 business days (skip Sat/Sun)
  const quoteDay = (() => {
    const d = new Date()
    let added = 0
    while (added < 4) {
      d.setDate(d.getDate() + 1)
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) added++
    }
    return d.toLocaleDateString('en-GB', { weekday: 'long' })
  })()

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
         HERO — Editorial full-bleed banner
         ════════════════════════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[720px] w-full overflow-hidden">
        {/* Banner image */}
        {heroSlide ? (
          <img
            src={heroSlide.imageUrl}
            alt="Hero banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#C4683A] via-[#8B4520] to-[#3D2418]" />
        )}

        {/* Tonal warm gradient — editorial darkroom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/85 via-[#1C1C1C]/40 to-[#1C1C1C]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1C]/55 via-transparent to-transparent" />

        {/* Hairline issue marker — top */}
        <div className="absolute top-24 lg:top-28 inset-x-0 z-10">
          <div className="section-container flex items-center justify-between text-cream/70">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-cream/40" />
              <span className="text-[10px] font-semibold tracking-[0.32em] uppercase">{issueLabel}</span>
            </div>
            <span className="text-[10px] font-semibold tracking-[0.32em] uppercase hidden sm:block">
              The Forestry Quarterly
            </span>
          </div>
        </div>

        {/* Headline anchored bottom-left */}
        <div className="absolute bottom-0 inset-x-0 pb-16 lg:pb-24 z-10">
          <div className="section-container">
            <div className="max-w-5xl">
              <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-terracotta-light mb-6 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-light animate-pulse-dot" />
                For Designers, Landscapers &amp; Contractors
              </p>

              <h1 className="font-heading text-cream font-bold leading-[0.98] tracking-tight text-[clamp(1.46rem,4.19vw,3.73rem)]">
                Custom pots, <em className="not-italic text-terracotta-light">manufactured to brief.</em> Quoted in <em className="not-italic text-terracotta-light">48 hours.</em>
              </h1>

              <p className="mt-4 font-heading text-cream/70 text-base lg:text-xl tracking-wide">
                Crafted to Order. Built to Last.
              </p>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-end">
                <p className="lg:col-span-5 text-cream/85 text-sm lg:text-base leading-relaxed font-light">
                  Manufacturing partner to 500+ approved UAE designers, landscapers, and contractors.
                  Send specifications. Receive a formal quote.
                </p>

                <div className="lg:col-span-7 flex items-center justify-start lg:justify-end gap-3 flex-wrap">
                  <Link
                    href="/request-access"
                    className="group inline-flex items-center gap-3 px-7 py-4 bg-cream text-charcoal text-sm font-bold tracking-wide uppercase hover:bg-terracotta hover:text-cream transition-colors duration-300"
                  >
                    Request Access
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#collection"
                    className="inline-flex items-center gap-3 px-7 py-4 border border-cream/30 text-cream text-sm font-bold tracking-wide uppercase hover:bg-cream/10 transition-colors duration-300"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-cream/60">
          <span className="text-[9px] font-semibold tracking-[0.32em] uppercase">Scroll</span>
          <ArrowDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         FIGURES — Editorial stats bar (typography-first)
         ════════════════════════════════════════════════════════════════ */}
      <section className="bg-cream border-y border-charcoal/10">
        <div className="section-container py-8 lg:py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 md:gap-y-0">
            {[
              { n: '500',  suffix: '+', label: 'Approved Vendors', note: 'Designers, landscapers, contractors' },
              { n: 'Est.', suffix: ' 20XX', label: 'Founded',         note: 'UAE-based since day one'             },
              { n: '48',   suffix: 'h', label: 'Quote Turnaround', note: 'On every submitted RFP'              },
              { n: 'No',   suffix: ' MOQ', label: 'Minimum Order',     note: 'From a single prototype'             },
              { n: '10K',  suffix: '+', label: 'Unit Capacity',    note: 'Production runs to scale'            },
            ].map((s, i, arr) => (
              <div
                key={s.label}
                className={`flex flex-col items-start ${
                  i > 0 ? 'md:pl-5 lg:pl-6 md:border-l border-charcoal/10' : ''
                } ${i < arr.length - 1 ? 'md:pr-5 lg:pr-6' : ''}`}
              >
                <div className="flex items-baseline gap-0.5 font-heading">
                  <span className="text-2xl md:text-3xl lg:text-[2.5rem] font-bold text-charcoal leading-none tracking-tight">
                    {s.n}
                  </span>
                  <span className="text-sm md:text-base text-terracotta font-bold">{s.suffix}</span>
                </div>
                <p className="mt-2 md:mt-3 text-[9px] md:text-[10px] font-semibold tracking-[0.18em] uppercase text-terracotta">
                  {s.label}
                </p>
                <p className="mt-1 text-[10px] md:text-xs text-charcoal/55 font-light leading-snug">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         CONTENTS — How it works (Magazine TOC style)
         ════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-cream-dark py-16 lg:py-20">
        <div className="section-container">
          {/* Section masthead */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 lg:mb-12">
            <div className="lg:col-span-4">
              <p className="text-[10px] font-semibold tracking-[0.32em] uppercase text-terracotta mb-4">
                § How It Works
              </p>
              <h2 className="font-heading text-charcoal font-bold leading-[1.05] text-[clamp(2rem,3.5vw,3rem)] tracking-tight">
                Specifications in. <em className="not-italic text-terracotta">Quote out.</em>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 flex items-end">
              <p className="text-charcoal/60 text-sm lg:text-base leading-relaxed max-w-lg font-light">
                Four steps. Two working days from RFP to formal quote.
              </p>
            </div>
          </div>

          {/* TOC list */}
          <div className="border-t border-charcoal/15">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="group grid grid-cols-12 gap-4 lg:gap-8 py-6 lg:py-7 border-b border-charcoal/15 hover:bg-cream/60 transition-colors duration-300"
              >
                <div className="col-span-2 lg:col-span-1">
                  <span className="font-heading text-3xl lg:text-4xl font-bold text-terracotta tabular-nums leading-none">
                    {step.n}
                  </span>
                </div>
                <div className="col-span-10 lg:col-span-4">
                  <h3 className="font-heading text-2xl lg:text-3xl font-bold text-charcoal leading-tight tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <div className="col-span-12 lg:col-span-7">
                  <p className="text-charcoal/65 text-base leading-relaxed font-light max-w-xl">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         COLLECTION — Featured products (gallery treatment)
         ════════════════════════════════════════════════════════════════ */}
      <section id="collection" className="bg-cream py-16 lg:py-20">
        <div className="section-container">
          {/* Section masthead */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 lg:mb-10">
            <div className="lg:col-span-7">
              <p className="text-[10px] font-semibold tracking-[0.32em] uppercase text-terracotta mb-4">
                § The Catalogue
              </p>
              <h2 className="font-heading text-charcoal font-bold leading-[1.05] text-[clamp(2rem,3.5vw,3rem)] tracking-tight">
                Featured pots. <em className="not-italic text-terracotta">Every one configurable.</em>
              </h2>
            </div>
            <div className="lg:col-span-4 lg:col-start-9 flex items-end">
              <p className="text-charcoal/60 text-sm leading-relaxed font-light">
                Click to configure dimensions, colour, texture, finish.
              </p>
            </div>
          </div>

          {/* Carousel — backend-connected, preserved */}
          {products.length > 0 ? (
            <ProductCarousel
              products={products.map(p => ({
                id:         p.id,
                sku:        p.sku,
                name:       p.name,
                isFeatured: p.isFeatured,
                imageUrl:   p.images[0]?.url ?? null,
                category:   p.categories[0]?.category.name ?? p.category ?? null,
              }))}
            />
          ) : (
            <div className="text-center py-20 border-y border-charcoal/15">
              <p className="font-heading text-2xl text-charcoal/40">Collection coming soon.</p>
            </div>
          )}

          {/* Quiet CTA */}
          <div className="mt-16 pt-10 border-t border-charcoal/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-charcoal/60 text-sm font-light max-w-md">
              The full catalogue — including pricing, the customiser, and the RFP system —
              is available to approved vendors only.
            </p>
            <Link
              href="/request-access"
              className="group inline-flex items-center gap-3 text-charcoal text-sm font-bold tracking-wide uppercase border-b border-charcoal pb-1 hover:text-terracotta hover:border-terracotta transition-colors"
            >
              Apply for Access
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         CAPABILITIES — Editorial three-up
         ════════════════════════════════════════════════════════════════ */}
      <section className="bg-charcoal py-16 lg:py-20 relative overflow-hidden">
        {/* Subtle warm wash */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-terracotta/8 blur-3xl pointer-events-none" />

        <div className="section-container relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10 lg:mb-12">
            <div className="lg:col-span-6">
              <p className="text-[10px] font-semibold tracking-[0.32em] uppercase text-terracotta-light mb-4">
                § Manufacturing Capability
              </p>
              <h2 className="font-heading text-cream font-bold leading-[1.05] text-[clamp(2rem,3.5vw,3rem)] tracking-tight">
                Three guarantees. <em className="not-italic text-terracotta-light">Every order.</em>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 flex items-end">
              <p className="text-cream/55 text-sm lg:text-base leading-relaxed font-light max-w-md">
                We don&apos;t stock. Every piece manufactured to brief.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
            {CAPABILITIES.map((c) => (
              <div
                key={c.n}
                className="bg-charcoal p-10 lg:p-12 hover:bg-charcoal/60 transition-colors duration-300 group"
              >
                <span className="block font-heading text-5xl lg:text-6xl font-bold text-terracotta-light/30 leading-none mb-8 group-hover:text-terracotta-light/60 transition-colors duration-300">
                  {c.n}
                </span>
                <h3 className="font-heading text-2xl lg:text-3xl font-bold text-cream leading-tight tracking-tight mb-4">
                  {c.title}
                </h3>
                <p className="text-cream/55 text-sm lg:text-base leading-relaxed font-light">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
         BACK COVER — Quiet final CTA / pull-quote
         ════════════════════════════════════════════════════════════════ */}
      <section className="bg-cream py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <div className="w-[700px] h-[700px] rounded-full bg-terracotta/4 blur-3xl" />
        </div>

        <div className="section-container relative">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[10px] font-semibold tracking-[0.32em] uppercase text-terracotta mb-8">
              — Apply for Vendor Access —
            </p>

            <blockquote className="font-heading text-charcoal font-bold leading-[1.1] tracking-tight text-[clamp(2rem,4.5vw,3.75rem)] mb-10">
              Apply today. Quote <em className="not-italic text-terracotta">by {quoteDay}.</em>
            </blockquote>

            <Link
              href="/request-access"
              className="group inline-flex items-center gap-3 px-9 py-4 bg-charcoal text-cream text-sm font-bold tracking-[0.16em] uppercase hover:bg-terracotta transition-colors duration-300"
            >
              Request Vendor Access
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
