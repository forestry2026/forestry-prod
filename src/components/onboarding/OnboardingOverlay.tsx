'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from './OnboardingProvider'
import { useAnchorRect } from './useAnchorRect'
import { AnnotationCard } from './AnnotationCard'
import { AnnotationLine } from './AnnotationLine'

const CARD_WIDTH = 360
const GAP        = 24

interface CardPos { top: number; left: number; width: number; height: number }

export function OnboardingOverlay() {
  const router = useRouter()
  const { activeTour, stepIndex, advance, back, skip, complete } = useOnboarding()
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardPos, setCardPos] = useState<CardPos | null>(null)

  const isFinale = activeTour ? stepIndex >= activeTour.steps.length : false
  const step     = activeTour && !isFinale ? activeTour.steps[stepIndex] : null
  const anchorId = step?.anchorId ?? null
  const anchor   = useAnchorRect(anchorId)

  // Position the card after each render
  useLayoutEffect(() => {
    if (!activeTour) return
    const measure = () => {
      const cardEl = cardRef.current
      if (!cardEl) return
      const cardH = cardEl.getBoundingClientRect().height
      const W     = CARD_WIDTH

      // No anchor → centre
      if (!anchor) {
        setCardPos({
          top:    (window.innerHeight - cardH) / 2,
          left:   (window.innerWidth  - W)     / 2,
          width:  W,
          height: cardH,
        })
        return
      }

      // Pick the side with the most free space
      const spaceR = window.innerWidth  - (anchor.left + anchor.width)
      const spaceL = anchor.left
      const spaceB = window.innerHeight - (anchor.top  + anchor.height)
      const spaceT = anchor.top
      const sides  = [
        { name: 'right',  space: spaceR, fits: spaceR >= W + GAP },
        { name: 'left',   space: spaceL, fits: spaceL >= W + GAP },
        { name: 'bottom', space: spaceB, fits: spaceB >= cardH + GAP },
        { name: 'top',    space: spaceT, fits: spaceT >= cardH + GAP },
      ]
      const chosen = sides.find(s => s.fits) ?? sides.sort((a, b) => b.space - a.space)[0]

      let top = 0, left = 0
      if (chosen.name === 'right') {
        left = anchor.left + anchor.width + GAP
        top  = clamp(anchor.top + anchor.height / 2 - cardH / 2, 16, window.innerHeight - cardH - 16)
      } else if (chosen.name === 'left') {
        left = anchor.left - W - GAP
        top  = clamp(anchor.top + anchor.height / 2 - cardH / 2, 16, window.innerHeight - cardH - 16)
      } else if (chosen.name === 'bottom') {
        top  = anchor.top + anchor.height + GAP
        left = clamp(anchor.left + anchor.width / 2 - W / 2, 16, window.innerWidth - W - 16)
      } else {
        top  = anchor.top - cardH - GAP
        left = clamp(anchor.left + anchor.width / 2 - W / 2, 16, window.innerWidth - W - 16)
      }

      setCardPos({ top, left, width: W, height: cardH })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeTour, stepIndex, anchor])

  // Keyboard support
  useEffect(() => {
    if (!activeTour) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
      else if (e.key === 'Enter') {
        if (isFinale) complete()
        else advance()
      }
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'ArrowRight') advance()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeTour, isFinale, skip, advance, back, complete])

  if (!activeTour) return null

  const handleAdvance = () => {
    if (step?.navigateTo) router.push(step.navigateTo)
    advance()
  }

  return (
    <>
      {/* Subtle dim — interface stays visible */}
      <div
        onClick={skip}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'rgba(45, 41, 38, 0.18)',
          zIndex:     9997,
          backdropFilter: 'blur(0.5px)',
        }}
      />

      {/* Connecting line (only when anchor + card both positioned) */}
      {anchor && cardPos && !isFinale && (
        <AnnotationLine card={cardPos} anchor={anchor} />
      )}

      {/* The card */}
      <div
        style={{
          position:      'fixed',
          top:           cardPos?.top  ?? -9999,
          left:          cardPos?.left ?? -9999,
          zIndex:        9999,
          pointerEvents: 'auto',
        }}
      >
        <AnnotationCard
          ref={cardRef}
          step={step ?? activeTour.steps[activeTour.steps.length - 1]}
          index={isFinale ? activeTour.steps.length - 1 : stepIndex}
          total={activeTour.steps.length}
          isFinale={isFinale}
          finale={activeTour.finale}
          onAdvance={handleAdvance}
          onBack={back}
          onSkip={skip}
          onComplete={complete}
          canGoBack={stepIndex > 0}
        />
      </div>
    </>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
