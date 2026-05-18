'use client'

import { ReactNode } from 'react'
import { OnboardingProvider } from './OnboardingProvider'
import { adminTour } from './tours/adminTour'

interface Props {
  children:  ReactNode
  userName?: string | null
}

/**
 * Client wrapper that auto-starts the admin tour on first login.
 * Mount inside the admin portal layout.
 */
export function AdminOnboardingMount({ children, userName }: Props) {
  return (
    <OnboardingProvider autoTour={adminTour} userName={userName}>
      {children}
    </OnboardingProvider>
  )
}
