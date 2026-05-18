'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import { Loader2, AlertTriangle, X } from 'lucide-react'

interface Props {
  rfpId:     string
  rfpNumber: string
}

export function WithdrawRfpButton({ rfpId, rfpNumber }: Props) {
  const router = useRouter()
  const [showModal,  setShowModal]  = useState(false)
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleWithdraw() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rfps/${rfpId}/withdraw`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? `Error ${res.status}`)
      }
      setShowModal(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-400 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100"
      >
        <X className="w-3.5 h-3.5" />
        Withdraw RFP
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(30,24,20,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => !isLoading && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Icon header */}
            <div className="px-7 pt-8 pb-5 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-5">
                <AlertTriangle className="w-7 h-7 text-rose-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-xl font-bold text-charcoal-900 mb-1">
                Withdraw this RFP?
              </h3>
              <p className="text-sm text-charcoal-400 leading-relaxed">
                <span className="font-mono font-semibold text-charcoal-700">{rfpNumber}</span> will be
                marked as withdrawn. You can submit a new RFP at any time.
              </p>

              {error && (
                <p className="mt-4 text-xs text-rose-600 font-medium bg-rose-50 px-4 py-2.5 rounded-xl w-full text-left">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-7 pb-7 flex gap-2.5">
              <button
                onClick={() => setShowModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-charcoal-600 bg-cream hover:bg-cream-dark border border-[#E8E0D5] rounded-xl transition-colors disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing…</>
                ) : (
                  'Yes, withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
