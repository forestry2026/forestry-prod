'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function VendorPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[vendor portal error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="flex items-center gap-3 text-rose-600">
        <AlertTriangle className="w-6 h-6" />
        <span className="font-semibold text-lg">Something went wrong</span>
      </div>
      <p className="text-sm text-charcoal-500 max-w-sm text-center">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-semibold bg-terracotta text-white rounded-xl hover:bg-terracotta/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
