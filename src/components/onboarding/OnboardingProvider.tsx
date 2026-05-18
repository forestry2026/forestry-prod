'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import type { OnboardingState, TourConfig, TourKey, TourStatus } from './types'
import { OnboardingOverlay } from './OnboardingOverlay'

interface Ctx {
  state:      OnboardingState
  activeTour: TourConfig | null
  stepIndex:  number
  /** Used to interpolate {name} tokens in step copy. */
  userName:   string
  start:      (tour: TourConfig) => void
  advance:    () => void
  back:       () => void
  skip:       () => void
  complete:   () => void
  /** Programmatically restart a finished tour. */
  replay:     (tour: TourConfig) => void
}

const OnboardingCtx = createContext<Ctx | null>(null)

export function useOnboarding() {
  const ctx = useContext(OnboardingCtx)
  if (!ctx) throw new Error('useOnboarding must be inside <OnboardingProvider>')
  return ctx
}

/**
 * Same as useOnboarding but returns null when no provider is mounted.
 * Use this in shared components (sidebars used across admin + manager + production layouts)
 * where the provider only wraps a subset of routes.
 */
export function useOnboardingOptional() {
  return useContext(OnboardingCtx)
}

interface ProviderProps {
  children:  ReactNode
  /** Optional auto-start tour when user has no progress. Pass the appropriate tour for the layout. */
  autoTour?: TourConfig | null
  /** Display name interpolated into step copy via {name} token. Falls back to "there". */
  userName?: string | null
}

export function OnboardingProvider({ children, autoTour = null, userName = null }: ProviderProps) {
  const [state, setState]           = useState<OnboardingState>({})
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null)
  const [stepIndex, setStepIndex]   = useState(0)
  const [hydrated, setHydrated]     = useState(false)

  // Fetch state on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/me/onboarding')
      .then(r => r.ok ? r.json() : { state: {} })
      .then(data => {
        if (cancelled) return
        setState(data.state ?? {})
        setHydrated(true)
      })
      .catch(() => setHydrated(true))
    return () => { cancelled = true }
  }, [])

  // Auto-start logic — fires ONCE on the very first session.
  // Guard order: localStorage flag → DB status. Localstorage prevents re-fire even
  // if a fast refresh kills the in-flight PATCH that writes 'in_progress' to DB.
  const autoStartFiredRef = useRef(false)
  useEffect(() => {
    if (!hydrated || !autoTour || activeTour) return
    if (autoStartFiredRef.current) return

    const lsKey = `onboarding.${autoTour.key}.fired`
    if (typeof window !== 'undefined' && window.localStorage.getItem(lsKey)) return

    const status = state[autoTour.key]
    if (status !== undefined) return // already started/skipped/completed once

    autoStartFiredRef.current = true
    if (typeof window !== 'undefined') window.localStorage.setItem(lsKey, '1')
    setActiveTour(autoTour)
    setStepIndex(0)
    persist({ [autoTour.key]: 'in_progress', lastStep: 0 } as Partial<OnboardingState>)
  }, [hydrated, autoTour, state, activeTour])

  const persist = useCallback(async (patch: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...patch }))
    try {
      await fetch('/api/me/onboarding', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
    } catch { /* swallow — UI still advances */ }
  }, [])

  const start = useCallback((tour: TourConfig) => {
    setActiveTour(tour)
    setStepIndex(0)
    persist({ [tour.key]: 'in_progress', lastStep: 0 } as Partial<OnboardingState>)
  }, [persist])

  const advance = useCallback(() => {
    if (!activeTour) return
    const next = stepIndex + 1
    if (next >= activeTour.steps.length) {
      setStepIndex(next)
      persist({ lastStep: next })
      return
    }
    setStepIndex(next)
    persist({ lastStep: next })
  }, [activeTour, stepIndex, persist])

  const back = useCallback(() => {
    if (stepIndex === 0) return
    setStepIndex(i => i - 1)
  }, [stepIndex])

  const skip = useCallback(() => {
    if (!activeTour) return
    persist({ [activeTour.key]: 'skipped' as TourStatus } as Partial<OnboardingState>)
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour, persist])

  const complete = useCallback(() => {
    if (!activeTour) return
    persist({
      [activeTour.key]: 'completed' as TourStatus,
      completedAt:      new Date().toISOString(),
    } as Partial<OnboardingState>)
    setActiveTour(null)
    setStepIndex(0)
  }, [activeTour, persist])

  const replay = useCallback((tour: TourConfig) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`onboarding.${tour.key}.fired`, '1')
    }
    persist({ [tour.key]: 'in_progress' as TourStatus, lastStep: 0 } as Partial<OnboardingState>)
    setActiveTour(tour)
    setStepIndex(0)
  }, [persist])

  const displayName = (userName ?? '').trim() || 'there'

  const value = useMemo<Ctx>(() => ({
    state, activeTour, stepIndex, userName: displayName,
    start, advance, back, skip, complete, replay,
  }), [state, activeTour, stepIndex, displayName, start, advance, back, skip, complete, replay])

  return (
    <OnboardingCtx.Provider value={value}>
      {children}
      {activeTour && <OnboardingOverlay />}
    </OnboardingCtx.Provider>
  )
}
