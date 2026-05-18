'use client'

import { useState } from 'react'
import { OnboardingProvider, useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { vendorTour } from '@/components/onboarding/tours/vendorTour'
import { adminTour }  from '@/components/onboarding/tours/adminTour'

/**
 * Visual QA page for the onboarding annotation system.
 * Lets you trigger either tour without affecting your real onboarding state.
 */
export default function OnboardingPreviewPage() {
  return (
    <OnboardingProvider>
      <PreviewContent />
    </OnboardingProvider>
  )
}

function PreviewContent() {
  const { start, replay, activeTour } = useOnboarding()
  const [theme, setTheme] = useState<'light' | 'cream'>('cream')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Internal · QA</p>
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Onboarding Preview</h1>
        <p className="text-sm text-charcoal-400 mt-1.5 max-w-xl">
          Trigger either tour to verify the annotation card, connecting line, and copy. No state is persisted from this page.
        </p>
      </div>

      {/* Trigger row */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => replay(vendorTour)}
          className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
        >
          Run Vendor tour
        </button>
        <button
          onClick={() => replay(adminTour)}
          className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-charcoal-700 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
        >
          Run Admin tour
        </button>
        {activeTour && (
          <span className="self-center text-xs text-charcoal-500">
            Active: <strong>{activeTour.title}</strong>
          </span>
        )}
      </div>

      {/* Mock target elements with data-tour-id matching the tour configs */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6 space-y-6">
        <h2 className="font-heading text-xl font-bold text-charcoal-900">Mock anchor targets</h2>
        <p className="text-sm text-charcoal-500">
          These buttons carry the same <code className="font-mono text-[11px] bg-cream px-1.5 py-0.5 rounded">data-tour-id</code> values that the real portal will use. The annotation line should snap to whichever one is referenced by the active step.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'vendor.nav.products',  label: 'Vendor · Products link' },
            { id: 'vendor.products.add',  label: 'Vendor · Add Product button' },
            { id: 'vendor.nav.rfp',       label: 'Vendor · RFPs link' },
            { id: 'vendor.nav.profile',   label: 'Vendor · Profile link' },
            { id: 'admin.nav.vendors',    label: 'Admin · Vendors link' },
            { id: 'admin.nav.products',   label: 'Admin · Products link' },
            { id: 'admin.nav.rfps',       label: 'Admin · RFPs link' },
            { id: 'admin.nav.users',      label: 'Admin · Users link' },
          ].map(t => (
            <button
              key={t.id}
              data-tour-id={t.id}
              className="text-left px-4 py-3 rounded-xl border border-[#E8E0D5] bg-cream/30 hover:border-terracotta/40 hover:bg-cream/60 transition-colors"
            >
              <p className="text-xs font-mono text-terracotta">{t.id}</p>
              <p className="text-sm font-semibold text-charcoal-900 mt-1">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Visual checklist */}
      <div className="bg-cream/40 rounded-2xl border border-[#E8E0D5] p-6 space-y-2">
        <h3 className="font-semibold text-charcoal-900 mb-2 text-sm uppercase tracking-wide">Visual QA checklist</h3>
        <ul className="text-sm text-charcoal-600 space-y-1.5 list-disc pl-5">
          <li>Card has a museum-placard step code (top-left, terracotta, mono).</li>
          <li>Headline is bold, ≤ 6 words.</li>
          <li>Body is 1 sentence, no marketing adjectives.</li>
          <li>Connecting line draws from card edge to nearest anchor edge.</li>
          <li>Backdrop is subtle dim — interface stays readable.</li>
          <li>Progress dots: current step is wider, completed steps fill terracotta.</li>
          <li>Skip link is always visible, top-right of card.</li>
          <li>Keyboard: Esc skips, Enter advances, ←/→ navigate.</li>
          <li>Reduced motion respected (no slide animation).</li>
        </ul>
      </div>
    </div>
  )
}
