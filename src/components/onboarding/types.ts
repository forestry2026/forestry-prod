export type TourKey = 'adminTour' | 'vendorTour'

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'auto'

export interface TourStep {
  /** Two-letter museum code shown on the card. e.g. 'ON-01' */
  code:        string
  /** Tied to a `data-tour-id="..."` on the actual UI element. Null = floating, centered. */
  anchorId:    string | null
  /** ≤ 6 words. Promise a benefit. */
  headline:    string
  /** One sentence. Specific facts beat adjectives. */
  body:        string
  /** Verb phrase. Real action, not "Got it". */
  cta:         string
  /** Optional secondary action — usually "I'll explore" or null. */
  secondary?:  string | null
  /** Side preference. 'auto' picks the side with most space. */
  side?:       Side
  /** Navigate to this URL when user clicks CTA. If null, just advance. */
  navigateTo?: string | null
}

export interface TourConfig {
  key:    TourKey
  title:  string
  /** Final card body shown after last step. */
  finale: { headline: string; body: string; cta: string }
  steps:  TourStep[]
}

export type TourStatus = 'in_progress' | 'completed' | 'skipped'

export interface OnboardingState {
  adminTour?:   TourStatus
  vendorTour?:  TourStatus
  lastStep?:    number
  completedAt?: string
}
