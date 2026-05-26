'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'

/**
 * Client wrapper around the 'Submit RFP Now' CTA on /portal/enquiry.
 *
 * Shows a spinner while navigation to /portal/rfp/new is in flight so
 * the user gets immediate feedback (server-rendered next page can
 * take a moment for first paint).
 */
export function SubmitRfpNowButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function handleClick() {
    if (loading) return
    setLoading(true)
    router.push('/portal/rfp/new')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="btn-primary inline-flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </>
      ) : (
        <>
          <FileText className="w-4 h-4" />
          Submit RFP Now
        </>
      )}
    </button>
  )
}
