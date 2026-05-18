'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Send, Save, X, CheckCircle2, RefreshCw, Download, Loader2 } from 'lucide-react'
import { generateQuotePdf } from '@/lib/generateQuotePdf'
import { cloudinaryRowThumb } from '@/lib/cloudinaryUrl'

interface QuoteBuilderProps {
  rfpId: string
  rfpNumber:         string
  companyName:       string
  contactName:       string
  contactEmail:      string
  brandLogoDataUrl?: string | null
  vendorLogoDataUrl?: string | null
  companyInfo?: {
    name:    string | null
    trn:     string | null
    email:   string | null
    phone:   string | null
    address: string | null
  } | null
  items: Array<{
    id: string
    productName?: string | null
    productSku?: string | null
    productImageUrl?: string | null
    isCustom: boolean
    quantity: number
    sizeLabel?: string | null
    color?: { name: string } | null
    texture?: { name: string } | null
    finish?: { name: string } | null
    unitPrice?: number | null
  }>
  existingQuote?: {
    subtotal:        number
    discount?:       number | null
    tax?:            number | null
    shipping?:       number | null
    total:           number
    validUntil:      Date | string
    terms?:          string | null
    notes?:          string | null
    productionDays?: number | null
    deliveryDays?:   number | null
    deliveryCharges?:number | null
    sentAt?:         Date | string | null
  } | null
  currentStatus: string
}

const EDITABLE_STATUSES = ['SUBMITTED', 'PENDING', 'QUOTED']

function toDateInputValue(val: Date | string | undefined | null): string {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  return d.toISOString().split('T')[0]
}

export function QuoteBuilder({ rfpId, rfpNumber, companyName, contactName, contactEmail, brandLogoDataUrl, vendorLogoDataUrl, companyInfo, items, existingQuote, currentStatus }: QuoteBuilderProps) {
  const router     = useRouter()
  const isEditable = EDITABLE_STATUSES.includes(currentStatus)
  const isReadOnly = !isEditable
  const alreadySent = !!existingQuote?.sentAt

  const [unitPrices, setUnitPrices] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    items.forEach((item) => {
      init[item.id] = item.unitPrice != null ? String(item.unitPrice) : ''
    })
    return init
  })

  type DiscountType = 'percent' | 'flat' | 'per_item'
  const [discountType,    setDiscountType]    = useState<DiscountType>('percent')
  const [discountValue,   setDiscountValue]   = useState<string>(existingQuote?.discount        != null ? String(existingQuote.discount)        : '')
  const [taxPct,          setTaxPct]          = useState<string>(existingQuote?.tax             != null ? String(existingQuote.tax)             : '')
  const [shipping,        setShipping]        = useState<string>(existingQuote?.shipping        != null ? String(existingQuote.shipping)        : '0')
  const [validUntil,      setValidUntil]      = useState<string>(toDateInputValue(existingQuote?.validUntil) || toDateInputValue(new Date(Date.now() + 14 * 86400000)))
  const [terms,           setTerms]           = useState<string>(existingQuote?.terms ?? '')
  const [adminNotes,      setAdminNotes]      = useState<string>(existingQuote?.notes ?? '')
  const [productionDays,  setProductionDays]  = useState<string>(existingQuote?.productionDays  != null ? String(existingQuote.productionDays)  : '')
  const [deliveryDays,    setDeliveryDays]    = useState<string>(existingQuote?.deliveryDays    != null ? String(existingQuote.deliveryDays)    : '')
  const [deliveryCharges, setDeliveryCharges] = useState<string>(existingQuote?.deliveryCharges != null ? String(existingQuote.deliveryCharges) : '0')

  const [sending,     setSending]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sent,        setSent]        = useState(false)   // local success flag

  // Derived totals
  const lineItems    = useMemo(() => items.map((item) => {
    const up = parseFloat(unitPrices[item.id] || '0') || 0
    return { ...item, computedUnitPrice: up, lineTotal: up * item.quantity }
  }), [items, unitPrices])

  const subtotal     = useMemo(() => lineItems.reduce((s, i) => s + i.lineTotal, 0), [lineItems])
  const totalQty     = useMemo(() => lineItems.reduce((s, i) => s + i.quantity,  0), [lineItems])
  const discountAmt  = useMemo(() => {
    const val = parseFloat(discountValue) || 0
    if (discountType === 'percent')  return Math.min(subtotal * (val / 100), subtotal)
    if (discountType === 'flat')     return Math.min(val, subtotal)
    if (discountType === 'per_item') return Math.min(val * totalQty, subtotal)
    return 0
  }, [discountType, discountValue, subtotal, totalQty])
  const afterDiscount = subtotal - discountAmt
  const taxAmt       = useMemo(() => afterDiscount * ((parseFloat(taxPct) || 0) / 100), [afterDiscount, taxPct])
  const shippingAmt  = parseFloat(shipping) || 0
  const total        = afterDiscount + taxAmt + shippingAmt

  function buildPayload(status: 'DRAFT' | 'SENT') {
    return {
      status,
      items:           lineItems.map((i) => ({ id: i.id, unitPrice: i.computedUnitPrice })),
      subtotal,
      discount:        discountAmt,
      tax:             parseFloat(taxPct)          || 0,
      shipping:        shippingAmt,
      total,
      validUntil,
      terms,
      notes:           adminNotes,
      productionDays:  productionDays  ? parseInt(productionDays)       : null,
      deliveryDays:    deliveryDays    ? parseInt(deliveryDays)          : null,
      deliveryCharges: deliveryCharges ? parseFloat(deliveryCharges)     : null,
    }
  }

  async function handleSaveDraft() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/rfp/${rfpId}/quote`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload('DRAFT')),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSendQuotation() {
    setSending(true); setError(null)
    try {
      const res = await fetch(`/api/rfp/${rfpId}/quote`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload('SENT')),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Send failed')
      setSent(true)
      // Auto-close and refresh after showing success for 2.4s
      setTimeout(() => {
        setShowConfirm(false)
        setSent(false)
        router.refresh()
      }, 2400)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDownloadPdf() {
    setError(null)
    setDownloadingPdf(true)
    const startedAt = Date.now()
    // Force browser to commit + paint the spinner before heavy work begins.
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    const deliveryChargesAmt = parseFloat(deliveryCharges) || 0
    try {

    // Fetch product images as base64 data URLs (best-effort, all in parallel).
    // Each image has a 5-second timeout so a slow/CORS-blocked URL can't hang the PDF forever.
    const imageDataUrls = await Promise.all(
      lineItems.map(async (item) => {
        if (!item.productImageUrl) return null
        const thumbUrl = cloudinaryRowThumb(item.productImageUrl) ?? item.productImageUrl
        try {
          const ctrl = new AbortController()
          const timer = setTimeout(() => ctrl.abort(), 5000)
          const res  = await fetch(thumbUrl, { signal: ctrl.signal })
          clearTimeout(timer)
          if (!res.ok) return null
          const blob = await res.blob()
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload  = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
        } catch { return null }
      })
    )

    generateQuotePdf({
      rfpNumber,
      companyName,
      contactName,
      contactEmail,
      lineItems: lineItems.map((item, i) => ({
        productName:       item.productName,
        productSku:        item.productSku,
        isCustom:          item.isCustom,
        quantity:          item.quantity,
        computedUnitPrice: item.computedUnitPrice,
        lineTotal:         item.lineTotal,
        sizeLabel:         item.sizeLabel ?? null,
        color:             item.color   ?? null,
        texture:           item.texture ?? null,
        finish:            item.finish  ?? null,
        imageDataUrl:      imageDataUrls[i] ?? null,
      })),
      subtotal,
      discountPct: discountAmt,
      discountAmt,
      taxPct:      parseFloat(taxPct) || 0,
      taxAmt,
      deliveryCharges: deliveryChargesAmt,
      total:       total + deliveryChargesAmt,
      validUntil,
      productionDays: productionDays ? parseInt(productionDays) : null,
      deliveryDays:   deliveryDays   ? parseInt(deliveryDays)   : null,
      terms:             terms || null,
      logoDataUrl:       brandLogoDataUrl ?? null,
      vendorLogoDataUrl: vendorLogoDataUrl ?? null,
      senderCompanyName: companyInfo?.name    ?? null,
      companyTrn:        companyInfo?.trn     ?? null,
      companyEmail:   companyInfo?.email   ?? null,
      companyPhone:   companyInfo?.phone   ?? null,
      companyAddress: companyInfo?.address ?? null,
    })
    } catch (e: any) {
      console.error('PDF generation failed:', e)
      setError(`PDF error: ${e?.message ?? String(e)}`)
    } finally {
      // Keep the spinner visible for at least 600ms so it doesn't just flicker.
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, 600 - elapsed)
      if (remaining) await new Promise<void>(r => setTimeout(r, remaining))
      setDownloadingPdf(false)
    }
  }

  // ── Read-only summary (APPROVED / IN_PRODUCTION / COMPLETED) ────
  if (isReadOnly) {
    return (
      <div className="bg-[#F5EDE0] rounded-xl border border-[#2D2926]/10 p-6">
        <h2 className="text-lg font-bold text-[#2D2926] mb-4">Quotation Summary</h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2926]/10">
                <th className="text-left pb-2 text-[#2D2926]/60 font-semibold">Product</th>
                <th className="text-left pb-2 text-[#2D2926]/60 font-semibold">Details</th>
                <th className="text-center pb-2 text-[#2D2926]/60 font-semibold">Qty</th>
                <th className="text-right pb-2 text-[#2D2926]/60 font-semibold">Unit Price (AED)</th>
                <th className="text-right pb-2 text-[#2D2926]/60 font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-[#2D2926]/5">
                  <td className="py-3 font-medium text-[#2D2926]">
                    {item.productName || 'Unnamed'}
                    {item.isCustom && <span className="ml-2 text-xs bg-[#C96B4A]/10 text-[#C96B4A] px-1.5 py-0.5 rounded font-semibold">Custom</span>}
                  </td>
                  <td className="py-3 text-[#2D2926]/60 text-xs">
                    {item.sizeLabel && <div>Size: {item.sizeLabel}</div>}
                    {item.color   && <div>Colour: {item.color.name}</div>}
                    {item.texture && <div>Texture: {item.texture.name}</div>}
                    {item.finish  && <div>Finish: {item.finish.name}</div>}
                  </td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{item.computedUnitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium">{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TotalsSummary
          subtotal={existingQuote != null ? Number(existingQuote.subtotal) : subtotal}
          discountPct={existingQuote?.tax != null ? String(existingQuote.tax) : '0'}
          discountAmt={existingQuote?.discount != null ? Number(existingQuote.discount) : discountAmt}
          taxPct={existingQuote?.tax != null ? String(existingQuote.tax) : taxPct}
          taxAmt={existingQuote != null
            ? (Number(existingQuote.subtotal) - Number(existingQuote.discount ?? 0)) * ((Number(existingQuote.tax ?? 0)) / 100)
            : taxAmt}
          shippingAmt={existingQuote?.shipping != null ? Number(existingQuote.shipping) : (existingQuote?.deliveryCharges != null ? Number(existingQuote.deliveryCharges) : shippingAmt)}
          total={existingQuote != null ? Number(existingQuote.total) : total}
          productionDays={existingQuote?.productionDays}
          deliveryDays={existingQuote?.deliveryDays}
          readOnly
        />
      </div>
    )
  }

  // ── Editable Quote Builder ───────────────────────────���───────────
  return (
    <>
      <div className="bg-white rounded-xl border border-[#2D2926]/10 shadow-sm">

        {/* Header — shows "sent" indicator if quote was previously dispatched */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2926]/10">
          <div>
            <h2 className="text-lg font-bold text-[#2D2926]">Quote Builder</h2>
            <p className="text-sm text-[#2D2926]/60 mt-0.5">Set unit prices for each item</p>
          </div>
          {alreadySent && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider">Quote Sent</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  {new Date(existingQuote!.sentAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2D2926]/10">
                <th className="text-left pb-3 text-[#2D2926]/60 font-semibold">Product</th>
                <th className="text-left pb-3 text-[#2D2926]/60 font-semibold">Details</th>
                <th className="text-center pb-3 text-[#2D2926]/60 font-semibold">Qty</th>
                <th className="text-right pb-3 text-[#2D2926]/60 font-semibold">Unit Price (AED)</th>
                <th className="text-right pb-3 text-[#2D2926]/60 font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-[#2D2926]/5">
                  <td className="py-3 pr-3 font-medium text-[#2D2926]">
                    <div>{item.productName || 'Unnamed product'}</div>
                    {item.productSku && <div className="text-xs text-[#2D2926]/40 mt-0.5">SKU: {item.productSku}</div>}
                    {item.isCustom && <span className="inline-block mt-1 text-xs bg-[#C96B4A]/10 text-[#C96B4A] px-1.5 py-0.5 rounded font-semibold">Custom</span>}
                  </td>
                  <td className="py-3 pr-3 text-[#2D2926]/60 text-xs">
                    {item.sizeLabel && <div>Size: {item.sizeLabel}</div>}
                    {item.color   && <div>Colour: {item.color.name}</div>}
                    {item.texture && <div>Texture: {item.texture.name}</div>}
                    {item.finish  && <div>Finish: {item.finish.name}</div>}
                  </td>
                  <td className="py-3 text-center font-medium">{item.quantity}</td>
                  <td className="py-3 text-right">
                    <input
                      type="number"
                      min="0" step="0.01"
                      value={unitPrices[item.id]}
                      onChange={(e) => setUnitPrices((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onFocus={(e) => e.target.select()}
                      className="w-28 text-right border border-[#2D2926]/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="py-3 text-right font-semibold text-[#2D2926]">
                    {item.lineTotal > 0 ? `AED ${item.lineTotal.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals + metadata */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 border-t border-[#2D2926]/10">
          {/* ── Redesigned Totals Panel ───────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-[#2D2926]/10 bg-white">

            {/* Header strip */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#2D2926]">
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/60">Totals</span>
              <span className="text-sm font-bold text-white font-mono">{items.length} line{items.length !== 1 ? 's' : ''} · {totalQty} unit{totalQty !== 1 ? 's' : ''}</span>
            </div>

            <div className="divide-y divide-[#2D2926]/8">

              {/* Subtotal */}
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-xs font-semibold tracking-wide uppercase text-[#2D2926]/45">Subtotal</span>
                <span className="text-sm font-bold text-[#2D2926] font-mono">AED {subtotal.toFixed(2)}</span>
              </div>

              {/* Discount */}
              <div className="px-5 py-4 space-y-3 bg-[#FAF6F1]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#2D2926]/45">Discount</span>
                  {discountAmt > 0 && (
                    <span className="text-xs font-bold text-[#C96B4A] font-mono">− AED {discountAmt.toFixed(2)}</span>
                  )}
                </div>

                {/* Type selector */}
                <div className="flex gap-1.5">
                  {([
                    { type: 'percent'  as const, label: '%',        sub: 'of subtotal' },
                    { type: 'flat'     as const, label: 'AED',      sub: 'flat amount' },
                    { type: 'per_item' as const, label: '÷ item',   sub: 'per unit'    },
                  ]).map(({ type, label, sub }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => !isReadOnly && setDiscountType(type)}
                      disabled={isReadOnly}
                      className={[
                        'flex-1 flex flex-col items-center py-2 px-1.5 rounded-xl border text-center transition-all duration-150',
                        discountType === type
                          ? 'bg-[#C96B4A] border-[#C96B4A] text-white shadow-sm'
                          : 'bg-white border-[#2D2926]/15 text-[#2D2926]/60 hover:border-[#C96B4A]/40 hover:text-[#2D2926]',
                        isReadOnly ? 'opacity-60 cursor-default' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <span className="text-[11px] font-bold leading-none">{label}</span>
                      <span className={`text-[9px] mt-0.5 leading-none font-medium ${discountType === type ? 'text-white/70' : 'text-[#2D2926]/35'}`}>{sub}</span>
                    </button>
                  ))}
                </div>

                {/* Value input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    {discountType !== 'percent' && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#2D2926]/40">AED</span>
                    )}
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'percent' ? '100' : undefined}
                      step={discountType === 'percent' ? '0.1' : '0.01'}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      onFocus={e => e.target.select()}
                      disabled={isReadOnly}
                      placeholder="0"
                      className={[
                        'w-full border border-[#2D2926]/20 rounded-xl py-2 text-sm font-mono font-semibold text-right text-[#2D2926]',
                        'focus:outline-none focus:border-[#C96B4A] focus:ring-2 focus:ring-[#C96B4A]/15',
                        'disabled:opacity-60 disabled:bg-[#2D2926]/5',
                        '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                        discountType !== 'percent' ? 'pl-10 pr-3' : 'pl-3 pr-7',
                      ].join(' ')}
                    />
                    {discountType === 'percent' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#2D2926]/40">%</span>
                    )}
                  </div>
                  {discountType === 'per_item' && totalQty > 0 && (
                    <span className="text-[10px] text-[#2D2926]/40 whitespace-nowrap font-medium">
                      × {totalQty} units
                    </span>
                  )}
                </div>
              </div>

              {/* Tax */}
              <div className="px-5 py-3.5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wide uppercase text-[#2D2926]/45 whitespace-nowrap">VAT / Tax</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0" max="100" step="0.1"
                        value={taxPct}
                        onChange={e => setTaxPct(e.target.value)}
                        onFocus={e => e.target.select()}
                        disabled={isReadOnly}
                        placeholder="5"
                        className="w-20 border border-[#2D2926]/20 rounded-xl pl-3 pr-7 py-1.5 text-sm font-mono text-right text-[#2D2926] focus:outline-none focus:border-[#C96B4A] focus:ring-2 focus:ring-[#C96B4A]/15 disabled:opacity-60 disabled:bg-[#2D2926]/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#2D2926]/35 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
                {taxAmt > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#2D2926]/35 font-medium">Tax amount</span>
                    <span className="text-[11px] font-bold text-[#2D2926]/55 font-mono">+ AED {taxAmt.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Delivery */}
              <div className="flex items-center justify-between gap-3 px-5 py-3.5">
                <span className="text-xs font-semibold tracking-wide uppercase text-[#2D2926]/45 whitespace-nowrap">Delivery (AED)</span>
                <input
                  type="number"
                  min="0" step="0.01"
                  value={deliveryCharges}
                  onChange={e => setDeliveryCharges(e.target.value)}
                  onFocus={e => e.target.select()}
                  disabled={isReadOnly}
                  className="w-28 border border-[#2D2926]/20 rounded-xl px-3 py-1.5 text-sm font-mono text-right text-[#2D2926] focus:outline-none focus:border-[#C96B4A] focus:ring-2 focus:ring-[#C96B4A]/15 disabled:opacity-60 disabled:bg-[#2D2926]/5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-5 py-4 bg-[#2D2926]">
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/50">Total</span>
                <span className="text-xl font-bold text-[#E8835F] font-mono tracking-tight">AED {total.toFixed(2)}</span>
              </div>

            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2D2926] mb-1">Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-[#2D2926]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30" />
            </div>
            {/* Lead Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#2D2926] mb-1">Production Time (days)</label>
                <input type="number" min="1" step="1" value={productionDays} onChange={(e) => setProductionDays(e.target.value)}
                  placeholder="21"
                  className="w-full border border-[#2D2926]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D2926] mb-1">Delivery Time (days)</label>
                <input type="number" min="1" step="1" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)}
                  placeholder="5"
                  className="w-full border border-[#2D2926]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2926] mb-1">Terms &amp; Conditions</label>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3}
                placeholder="Payment terms, delivery conditions..."
                className="w-full border border-[#2D2926]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2926] mb-1">Admin Notes (internal)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
                placeholder="Internal notes not visible to vendor..."
                className="w-full border border-[#2D2926]/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C96B4A] focus:ring-1 focus:ring-[#C96B4A]/30 resize-none" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action bar */}
        <div className="sticky bottom-0 bg-white border-t border-[#2D2926]/10 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end rounded-b-xl">
          <button onClick={handleDownloadPdf} disabled={downloadingPdf}
            className="flex items-center justify-center gap-2 border-2 border-[#2D2926] text-[#2D2926] font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2D2926]/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {downloadingPdf
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><Download className="w-4 h-4" /> Download PDF</>
            }
          </button>
          <button onClick={handleSaveDraft} disabled={saving}
            className="flex items-center justify-center gap-2 border-2 border-[#2D2926] text-[#2D2926] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#2D2926]/5 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => setShowConfirm(true)} disabled={sending || total === 0}
            className="flex items-center justify-center gap-2 bg-[#C96B4A] hover:bg-[#b85e3f] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {alreadySent ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {alreadySent ? 'Resend Quotation' : 'Send Quotation'}
          </button>
        </div>
      </div>

      {/* Confirm / Success modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">

            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-[#2D2926] mb-2">Quotation Sent!</h3>
                <p className="text-sm text-[#2D2926]/60 mb-1">
                  The vendor has been notified by email.
                </p>
                <p className="text-2xl font-bold text-[#C96B4A] mt-4">AED {total.toFixed(2)}</p>
                <p className="text-xs text-[#2D2926]/40 mt-2">
                  Valid until{' '}
                  {validUntil ? new Date(validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </p>
                <p className="text-xs text-[#2D2926]/30 mt-6">Closing automatically…</p>
              </div>
            ) : (
              /* ── Confirm state ── */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#2D2926]">
                    {alreadySent ? 'Resend Quotation?' : 'Send Quotation?'}
                  </h3>
                  <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-[#F5EDE0] rounded-lg transition-colors">
                    <X className="w-5 h-5 text-[#2D2926]/60" />
                  </button>
                </div>
                {alreadySent && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    A quotation was already sent to this vendor. This will replace it.
                  </div>
                )}
                <p className="text-sm text-[#2D2926]/70 mb-2">You are about to send a quotation totalling:</p>
                <p className="text-3xl font-bold text-[#C96B4A] mb-4">AED {total.toFixed(2)}</p>
                <p className="text-sm text-[#2D2926]/60 mb-6">
                  Valid until:{' '}
                  <span className="font-medium text-[#2D2926]">
                    {validUntil ? new Date(validUntil).toLocaleDateString() : '—'}
                  </span>
                </p>
                {error && (
                  <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 border-2 border-[#2D2926]/20 text-[#2D2926] font-semibold px-4 py-2.5 rounded-lg hover:bg-[#2D2926]/5 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSendQuotation} disabled={sending}
                    className="flex-1 bg-[#C96B4A] hover:bg-[#b85e3f] text-white font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending…' : 'Confirm & Send'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}

// ── Shared totals display ───────────────────��────────────────────
function TotalsSummary({ subtotal, discountPct, discountAmt, taxPct, taxAmt, shippingAmt, total, productionDays, deliveryDays, deliveryCharges, readOnly }: {
  subtotal: number; discountPct: string; discountAmt: number; taxPct: string
  taxAmt: number; shippingAmt: number; total: number
  productionDays?: number | null; deliveryDays?: number | null; deliveryCharges?: number | null
  readOnly?: boolean
}) {
  return (
    <div className="space-y-2 text-sm max-w-xs ml-auto">
      <div className="flex justify-between">
        <span className="text-[#2D2926]/60">Subtotal</span>
        <span>AED {subtotal.toFixed(2)}</span>
      </div>
      {parseFloat(discountPct) > 0 && (
        <div className="flex justify-between text-[#C96B4A]">
          <span>Discount ({discountPct}%)</span>
          <span>- AED {discountAmt.toFixed(2)}</span>
        </div>
      )}
      {parseFloat(taxPct) > 0 && (
        <div className="flex justify-between text-[#2D2926]/60">
          <span>Tax ({taxPct}%)</span>
          <span>+ AED {taxAmt.toFixed(2)}</span>
        </div>
      )}
      {shippingAmt > 0 && (
        <div className="flex justify-between text-[#2D2926]/60">
          <span>Delivery Charges</span>
          <span>+ AED {shippingAmt.toFixed(2)}</span>
        </div>
      )}
      {deliveryCharges != null && deliveryCharges > 0 && (
        <div className="flex justify-between text-[#2D2926]/60">
          <span>Delivery Charges</span>
          <span>+ AED {deliveryCharges.toFixed(2)}</span>
        </div>
      )}
      <div className="pt-3 border-t border-[#2D2926]/20 flex justify-between items-center">
        <span className="font-bold text-[#2D2926]">Total</span>
        <span className="text-2xl font-bold text-[#C96B4A]">AED {total.toFixed(2)}</span>
      </div>
      {(productionDays || deliveryDays) && (
        <div className="pt-3 border-t border-[#2D2926]/10 space-y-1.5">
          {productionDays && (
            <div className="flex justify-between text-[#2D2926]/60">
              <span>Production Time</span>
              <span className="font-medium text-[#2D2926]">{productionDays} days</span>
            </div>
          )}
          {deliveryDays && (
            <div className="flex justify-between text-[#2D2926]/60">
              <span>Delivery Time</span>
              <span className="font-medium text-[#2D2926]">{deliveryDays} days</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
