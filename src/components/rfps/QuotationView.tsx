'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from 'lucide-react'

interface QuotationViewProps {
  rfpId: string
  rfpNumber: string
  quote: {
    subtotal: number
    discount?: number | null
    tax?: number | null
    shipping?: number | null
    total: number
    validUntil: Date | string
    terms?: string | null
    sentAt?: Date | string | null
  }
  items: Array<{
    id: string
    productName?: string | null
    quantity: number
    unitPrice?: number | null
    isCustom: boolean
    customWidth?: number | null
    customHeight?: number | null
    customDepth?: number | null
  }>
  currentStatus: string
  revisionRequest?: string | null
}

function formatDate(val: Date | string | null | undefined) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-AE', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function QuotationView({
  rfpId,
  rfpNumber,
  quote,
  items,
  currentStatus,
  revisionRequest,
}: QuotationViewProps) {
  const router = useRouter()
  const [termsOpen, setTermsOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionText, setRevisionText] = useState(revisionRequest ?? '')
  const [accepting, setAccepting] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discountPct = quote.discount ?? 0
  const taxPct = quote.tax ?? 0
  const shippingAmt = quote.shipping ?? 0
  const discountAmt = quote.subtotal * (discountPct / 100)
  const afterDiscount = quote.subtotal - discountAmt
  const taxAmt = afterDiscount * (taxPct / 100)

  const lineItems = items.map((item) => ({
    ...item,
    up: item.unitPrice ?? 0,
    lineTotal: (item.unitPrice ?? 0) * item.quantity,
  }))

  async function handleAccept() {
    setAccepting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rfp/${rfpId}/accept`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to accept')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAccepting(false)
    }
  }

  async function handleRevision() {
    if (!revisionText.trim()) return
    setRequesting(true)
    setError(null)
    try {
      const res = await fetch(`/api/rfp/${rfpId}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revisionText }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to request revision')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRequesting(false)
    }
  }

  const showActions = currentStatus === 'QUOTED'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#2D2926]/10 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#C96B4A]/10 text-[#C96B4A] px-2.5 py-1 rounded-full">
                Quotation Received
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#2D2926]">{rfpNumber}</h2>
            {quote.sentAt && (
              <p className="text-sm text-[#2D2926]/60 mt-1">Sent {formatDate(quote.sentAt)}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-[#2D2926]/50 font-medium uppercase tracking-wider mb-1">Valid Until</div>
            <div className="text-base font-bold text-[#2D2926]">{formatDate(quote.validUntil)}</div>
          </div>
        </div>
      </div>

      {/* Status banners */}
      {currentStatus === 'APPROVED' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Quotation Accepted</p>
            <p className="text-sm text-emerald-700">Your acceptance has been recorded. Production will begin shortly.</p>
          </div>
        </div>
      )}
      {currentStatus === 'IN_PRODUCTION' && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
          <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
          <div>
            <p className="font-semibold text-blue-800">In Production</p>
            <p className="text-sm text-blue-700">Your order is currently being manufactured.</p>
          </div>
        </div>
      )}
      {currentStatus === 'COMPLETED' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Order Completed</p>
            <p className="text-sm text-emerald-700">This order has been completed and delivered.</p>
          </div>
        </div>
      )}

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-[#2D2926]/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2D2926]/10">
          <h3 className="font-bold text-[#2D2926]">Items Quoted</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5EDE0]/60">
                <th className="text-left px-6 py-3 text-[#2D2926]/60 font-semibold">Product</th>
                <th className="text-center px-4 py-3 text-[#2D2926]/60 font-semibold">Qty</th>
                <th className="text-right px-4 py-3 text-[#2D2926]/60 font-semibold">Unit Price (AED)</th>
                <th className="text-right px-6 py-3 text-[#2D2926]/60 font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-t border-[#2D2926]/5">
                  <td className="px-6 py-4 font-medium text-[#2D2926]">
                    <div>{item.productName || 'Unnamed product'}</div>
                    {item.isCustom && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-[#C96B4A]/10 text-[#C96B4A] px-1.5 py-0.5 rounded font-semibold">
                          Custom
                        </span>
                        {item.customWidth && (
                          <span className="text-xs text-[#2D2926]/50">
                            {item.customWidth}×{item.customHeight}×{item.customDepth} cm
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">{item.quantity}</td>
                  <td className="px-4 py-4 text-right">{item.up.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-semibold">{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Card */}
      <div className="bg-[#F5EDE0] rounded-xl p-6">
        <h3 className="font-bold text-[#2D2926] mb-4">Summary</h3>
        <div className="space-y-2 text-sm max-w-sm ml-auto">
          <div className="flex justify-between">
            <span className="text-[#2D2926]/60">Subtotal</span>
            <span>AED {quote.subtotal.toFixed(2)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex justify-between text-[#C96B4A]">
              <span>Discount ({discountPct}%)</span>
              <span>- AED {discountAmt.toFixed(2)}</span>
            </div>
          )}
          {taxPct > 0 && (
            <div className="flex justify-between text-[#2D2926]/60">
              <span>VAT ({taxPct}%)</span>
              <span>+ AED {taxAmt.toFixed(2)}</span>
            </div>
          )}
          {shippingAmt > 0 && (
            <div className="flex justify-between text-[#2D2926]/60">
              <span>Shipping</span>
              <span>+ AED {shippingAmt.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-4 border-t border-[#2D2926]/20 flex justify-between items-center">
            <span className="font-bold text-[#2D2926] text-base">Total</span>
            <span className="text-3xl font-bold text-[#C96B4A]">AED {quote.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Terms (collapsible) */}
      {quote.terms && (
        <div className="bg-white rounded-xl border border-[#2D2926]/10 overflow-hidden">
          <button
            onClick={() => setTermsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[#F5EDE0]/40 transition-colors"
          >
            <span className="font-semibold text-[#2D2926]">Terms & Conditions</span>
            {termsOpen ? (
              <ChevronUp className="w-4 h-4 text-[#2D2926]/50" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#2D2926]/50" />
            )}
          </button>
          {termsOpen && (
            <div className="px-6 pb-5 text-sm text-[#2D2926]/70 whitespace-pre-wrap border-t border-[#2D2926]/5">
              <div className="pt-4">{quote.terms}</div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* CTA Buttons — only when QUOTED */}
      {showActions && (
        <div className="bg-white rounded-xl border border-[#2D2926]/10 p-6 space-y-4">
          <h3 className="font-bold text-[#2D2926]">Your Response</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 flex items-center justify-center gap-2 bg-[#C96B4A] hover:bg-[#b85e3f] text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              {accepting ? 'Processing...' : 'Accept Quotation'}
            </button>
            <button
              onClick={() => setRevisionOpen((o) => !o)}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-[#2D2926]/20 text-[#2D2926] font-semibold px-6 py-3 rounded-xl hover:bg-[#2D2926]/5 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Request Revision
            </button>
          </div>

          {revisionOpen && (
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium text-[#2D2926]">
                Reason for revision request
              </label>
              <textarea
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                rows={4}
                placeholder="Describe what you'd like to revise..."
                className="w-full border border-[#2D2926]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRevisionOpen(false)}
                  className="text-sm text-[#2D2926]/60 hover:text-[#2D2926] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevision}
                  disabled={requesting || !revisionText.trim()}
                  className="bg-[#2D2926] hover:bg-[#2D2926]/80 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {requesting ? 'Submitting...' : 'Submit Revision Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
