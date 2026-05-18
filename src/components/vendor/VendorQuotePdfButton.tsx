'use client'

import { useState }            from 'react'
import { Download, Loader2 }   from 'lucide-react'
import { generateQuotePdf }    from '@/lib/generateQuotePdf'

interface QuoteItem {
  id:           string
  productName:  string | null
  productSku:   string | null
  quantity:     number
  unitPrice:    number | null
  isCustom:     boolean
  imageUrl:     string | null
  sizeLabel:    string | null
  colorName:    string | null
  textureName:  string | null
  finishName:   string | null
}

interface Props {
  rfpNumber:         string
  companyName:       string
  contactName:       string
  contactEmail:      string
  brandLogoDataUrl:  string | null
  vendorLogoDataUrl: string | null
  items:             QuoteItem[]
  subtotal:          number
  discount:          number | null   // stored as %
  tax:               number | null   // stored as %
  shipping:          number | null
  deliveryCharges:   number | null
  total:             number
  validUntil:        string | Date
  productionDays:    number | null
  deliveryDays:      number | null
  terms:             string | null
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return await new Promise<string>(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

export function VendorQuotePdfButton({
  rfpNumber, companyName, contactName, contactEmail,
  brandLogoDataUrl, vendorLogoDataUrl,
  items, subtotal, discount, tax, shipping, deliveryCharges,
  total, validUntil, productionDays, deliveryDays, terms,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleDownload() {
    setLoading(true)
    setError(null)
    try {
      // Fetch product images as data URLs in parallel
      const imageDataUrls = await Promise.all(
        items.map(item => item.imageUrl ? toDataUrl(item.imageUrl) : Promise.resolve(null))
      )

      // Compute amounts
      const discountPct = discount ?? 0
      const taxPct      = tax      ?? 0
      const discountAmt = subtotal * (discountPct / 100)
      const afterDisc   = subtotal - discountAmt
      const taxAmt      = afterDisc * (taxPct / 100)
      const delivery    = deliveryCharges ?? shipping ?? 0

      generateQuotePdf({
        rfpNumber,
        companyName,
        contactName,
        contactEmail,
        lineItems: items.map((item, i) => ({
          productName:       item.productName,
          productSku:        item.productSku,
          isCustom:          item.isCustom,
          quantity:          item.quantity,
          computedUnitPrice: item.unitPrice ?? 0,
          lineTotal:         (item.unitPrice ?? 0) * item.quantity,
          sizeLabel:         item.sizeLabel,
          color:             item.colorName   ? { name: item.colorName }   : null,
          texture:           item.textureName ? { name: item.textureName } : null,
          finish:            item.finishName  ? { name: item.finishName }  : null,
          imageDataUrl:      imageDataUrls[i] ?? null,
        })),
        subtotal,
        discountPct,
        discountAmt,
        taxPct,
        taxAmt,
        deliveryCharges: delivery,
        total,
        validUntil: new Date(validUntil).toISOString().split('T')[0],
        productionDays: productionDays ?? null,
        deliveryDays:   deliveryDays   ?? null,
        terms,
        logoDataUrl:       brandLogoDataUrl  ?? null,
        vendorLogoDataUrl: vendorLogoDataUrl ?? null,
      })
    } catch (e: any) {
      setError(`PDF error: ${e?.message ?? String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          : <><Download className="w-4 h-4" /> Download Quote PDF</>
        }
      </button>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}
