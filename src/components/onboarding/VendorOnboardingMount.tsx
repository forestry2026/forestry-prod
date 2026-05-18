'use client'

import { ReactNode } from 'react'
import { OnboardingProvider } from './OnboardingProvider'
import { vendorTour } from './tours/vendorTour'

interface Props {
  children:  ReactNode
  userName?: string | null
}

/**
 * Client wrapper that auto-starts the vendor tour on first login.
 * Mount inside the vendor portal layout.
 */
export function VendorOnboardingMount({ children, userName }: Props) {
  return (
    <OnboardingProvider autoTour={vendorTour} userName={userName}>
      {children}
    </OnboardingProvider>
  )
}
