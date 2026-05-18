'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import {
  Loader2, CheckCircle2, MapPin, Building2, Truck, StickyNote, ArrowRight, AlertCircle,
} from 'lucide-react'

interface EnquiryItem {
  id: string
  productId: string
  dimensionId:  string | null
  colorId:      string | null
  textureId:    string | null
  finishId:     string | null
  variantName:  string | null
  variantPrice: number | null
  isCustomSize:     boolean
  customDimensions: string | null
  customWidth:  number | null
  customHeight: number | null
  customDepth:  number | null
  customColorHex:  string | null
  customColorRal:  string | null
  customColorName: string | null
  customTextureUrl: string | null
  customFinishDesc: string | null
  holesOption: string | null
  quantity: number
  notes:    string | null
}

interface Props {
  vendorProfileId: string
  items: EnquiryItem[]
}

export function RfpSubmissionForm({ vendorProfileId, items }: Props) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [rfpNumber, setRfpNumber] = useState<string | null>(null)

  const [projectName,     setProjectName]     = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes,           setNotes]           = useState('')

  // Touched per-field so errors show only after each field is blurred or on submit
  const [touchedFields, setTouchedFields] = useState({
    projectName: false, projectLocation: false, deliveryAddress: false,
  })

  const touch = (field: keyof typeof touchedFields) =>
    setTouchedFields(prev => ({ ...prev, [field]: true }))

  const nameErr     = touchedFields.projectName     && !projectName.trim()
  const locationErr = touchedFields.projectLocation && !projectLocation.trim()
  const addressErr  = touchedFields.deliveryAddress && !deliveryAddress.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Touch all required fields
    setTouchedFields({ projectName: true, projectLocation: true, deliveryAddress: true })
    if (!projectName.trim() || !projectLocation.trim() || !deliveryAddress.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/rfps', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorProfileId,
          projectName:     projectName     || undefined,
          projectLocation: projectLocation || undefined,
          deliveryAddress: deliveryAddress || undefined,
          notes:           notes           || undefined,
          items: items.map(item => ({
            productId:        item.productId,
            dimensionId:      item.dimensionId       || undefined,
            colorId:          item.colorId           || undefined,
            textureId:        item.textureId         || undefined,
            finishId:         item.finishId          || undefined,
            variantName:      item.variantName       || undefined,
            variantPrice:     item.variantPrice      ?? undefined,
            isCustomSize:     item.isCustomSize      || undefined,
            customDimensions: item.customDimensions  || undefined,
            customWidth:      item.customWidth       ?? undefined,
            customHeight:     item.customHeight      ?? undefined,
            customDepth:      item.customDepth       ?? undefined,
            customColorHex:   item.customColorHex    || undefined,
            customColorRal:   item.customColorRal    || undefined,
            customColorName:  item.customColorName   || undefined,
            customTextureUrl: item.customTextureUrl  || undefined,
            customFinishDesc: item.customFinishDesc  || undefined,
            holesOption:      item.holesOption       || undefined,
            quantity:         item.quantity,
            notes:            item.notes             || undefined,
          })),
        }),
      })

      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }

      const data = await res.json()
      setRfpNumber(data.data.rfpNumber ?? null)

      setTimeout(() => {
        router.push(`/portal/rfp/${data.data.id}`)
        router.refresh()
      }, 2800)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /* ── Success state ── */
  if (rfpNumber !== null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-10 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-sage-600" strokeWidth={1.5} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-2">
          Submitted Successfully
        </p>
        <h2 className="font-heading text-3xl font-bold text-charcoal-900 mb-2">RFP Created</h2>
        <p className="font-mono text-sm text-charcoal-400 bg-charcoal-50 px-3 py-1.5 rounded-lg mb-6">
          {rfpNumber}
        </p>
        <p className="text-sm text-charcoal-500 leading-relaxed max-w-xs">
          Our team will review your request and respond with a quotation shortly.
        </p>
        <p className="text-xs text-charcoal-400 mt-8 flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" />
          Redirecting to your RFP…
        </p>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" noValidate>

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-[#E8E0D5]">
        <h2 className="font-heading text-2xl font-bold text-charcoal-900">Project Details</h2>
        <p className="text-sm text-charcoal-400 mt-1.5">
          Tell us about your project so we can tailor the quotation.
        </p>
      </div>

      {/* Fields */}
      <div className="flex-1 px-8 py-7 space-y-5 overflow-y-auto">

        {/* API error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* ── Required fields group ── */}
        <div className="space-y-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-charcoal-400">
            Required Information
          </p>

          {/* Project Name */}
          <div className="space-y-1.5">
            <label htmlFor="projectName" className="flex items-center gap-2 text-xs font-bold text-charcoal-600">
              <Building2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              Project Name
              <span className="text-terracotta ml-auto text-[10px] font-semibold normal-case tracking-normal">Required</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={() => touch('projectName')}
              className={`form-input text-sm ${nameErr ? 'form-input-error' : ''}`}
              placeholder="e.g., Luxury Villa Landscaping"
            />
            {nameErr && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center flex-shrink-0 font-bold">!</span>
                Project name is required
              </p>
            )}
          </div>

          {/* Project Location */}
          <div className="space-y-1.5">
            <label htmlFor="projectLocation" className="flex items-center gap-2 text-xs font-bold text-charcoal-600">
              <MapPin className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              Project Location
              <span className="text-terracotta ml-auto text-[10px] font-semibold normal-case tracking-normal">Required</span>
            </label>
            <input
              id="projectLocation"
              type="text"
              value={projectLocation}
              onChange={e => setProjectLocation(e.target.value)}
              onBlur={() => touch('projectLocation')}
              className={`form-input text-sm ${locationErr ? 'form-input-error' : ''}`}
              placeholder="e.g., Dubai Marina, UAE"
            />
            {locationErr && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center flex-shrink-0 font-bold">!</span>
                Project location is required
              </p>
            )}
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label htmlFor="deliveryAddress" className="flex items-center gap-2 text-xs font-bold text-charcoal-600">
              <Truck className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              Delivery Address
              <span className="text-terracotta ml-auto text-[10px] font-semibold normal-case tracking-normal">Required</span>
            </label>
            <textarea
              id="deliveryAddress"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              onBlur={() => touch('deliveryAddress')}
              className={`form-input resize-none text-sm ${addressErr ? 'form-input-error' : ''}`}
              rows={3}
              placeholder="Full delivery address including building name, street, area…"
            />
            {addressErr && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center flex-shrink-0 font-bold">!</span>
                Delivery address is required
              </p>
            )}
          </div>
        </div>

        {/* ── Optional field ── */}
        <div className="pt-2 border-t border-[#E8E0D5] space-y-1.5">
          <label htmlFor="notes" className="flex items-center gap-2 text-xs font-bold text-charcoal-600 mt-4">
            <StickyNote className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" />
            Additional Notes
            <span className="ml-auto text-[10px] text-charcoal-400 font-medium normal-case tracking-normal">Optional</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="form-input resize-none text-sm"
            rows={3}
            placeholder="Special requirements, lead time expectations, access restrictions…"
          />
        </div>

      </div>

      {/* Footer */}
      <div className="px-8 h-[72px] border-t border-[#E8E0D5] bg-cream-dark flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="btn-ghost text-sm px-4"
        >
          ← Back
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting RFP…
            </>
          ) : (
            <>
              Submit RFP
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </form>
  )
}
