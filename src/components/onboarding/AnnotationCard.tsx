'use client'

import { forwardRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { TourStep } from './types'
import { useOnboarding } from './OnboardingProvider'

interface Props {
  step:        TourStep
  index:       number
  total:       number
  isFinale?:   boolean
  finale?:     { headline: string; body: string; cta: string }
  onAdvance:   () => void
  onBack:      () => void
  onSkip:      () => void
  onComplete:  () => void
  canGoBack:   boolean
}

export const AnnotationCard = forwardRef<HTMLDivElement, Props>(function AnnotationCard(
  { step, index, total, isFinale, finale, onAdvance, onBack, onSkip, onComplete, canGoBack },
  ref,
) {
  const { userName } = useOnboarding()
  const interp = (s: string) => s.replace(/\{name\}/g, userName)
  const headline = interp(isFinale && finale ? finale.headline : step.headline)
  const body     = interp(isFinale && finale ? finale.body     : step.body)
  const cta      = interp(isFinale && finale ? finale.cta      : step.cta)

  return (
    <div
      ref={ref}
      role="dialog"
      aria-live="polite"
      className="onboarding-card pointer-events-auto"
      style={{
        position:        'fixed',
        zIndex:          9999,
        width:           360,
        maxWidth:        'calc(100vw - 32px)',
        background:      '#FAF6F0',
        border:          '1px solid rgba(201, 107, 74, 0.35)',
        borderRadius:    16,
        boxShadow:       '0 12px 32px -12px rgba(45, 41, 38, 0.18), 0 4px 12px -4px rgba(45, 41, 38, 0.08)',
        padding:         '20px 22px',
        animation:       'onboardingFadeIn 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Header row: museum code + skip */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-mono text-[10px] tracking-[0.18em] uppercase font-semibold"
          style={{ color: '#C96B4A' }}
        >
          {step.code}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-[10px] uppercase tracking-wider font-semibold text-charcoal-400 hover:text-charcoal-700 transition-colors"
        >
          Skip — replay anytime
        </button>
      </div>

      {/* Headline */}
      <h3
        className="font-heading font-bold text-charcoal-900 leading-tight mb-2"
        style={{ fontSize: 19 }}
      >
        {headline}
      </h3>

      {/* Body */}
      <p
        className="text-charcoal-600 leading-relaxed"
        style={{ fontSize: 13.5, lineHeight: 1.55 }}
      >
        {body}
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mt-5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              width:        i === index ? 16 : 5,
              height:       5,
              borderRadius: 99,
              background:   i <= index ? '#C96B4A' : 'rgba(45, 41, 38, 0.18)',
              transition:   'width 200ms ease, background 200ms ease',
            }}
          />
        ))}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center gap-1 text-xs font-semibold text-charcoal-400 hover:text-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back
        </button>

        <button
          type="button"
          onClick={isFinale ? onComplete : onAdvance}
          className="px-4 h-9 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#C96B4A' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#B85C3B')}
          onMouseLeave={e => (e.currentTarget.style.background = '#C96B4A')}
        >
          {cta}
        </button>
      </div>

      <style jsx>{`
        @keyframes onboardingFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .onboarding-card { animation: none !important; }
        }
      `}</style>
    </div>
  )
})
