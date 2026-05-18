'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { useBasket } from '@/lib/basket/useBasket'
import type { BasketItem } from '@/lib/basket/useBasket'

// ── Delete Confirm Modal ──────────────────────────────────────────
function DeleteConfirmModal({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#e8dcc4]">
        {/* Icon header */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="font-heading text-base font-bold text-[#2D2926]">Remove item?</h3>
          <p className="text-sm text-[#2D2926]/60 mt-1.5 leading-relaxed">
            <span className="font-semibold text-[#2D2926]">{productName}</span> will be removed from your enquiry basket.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border-2 border-[#e8dcc4] text-sm font-semibold text-[#2D2926] hover:bg-[#F5EDE0] hover:border-[#C96B4A]/30 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Auth Modal ────────────────────────────────────────────────────
type AuthTab = 'signin' | 'new-vendor'

interface AuthModalProps {
  onClose: () => void
  onSuccess: () => void
}

function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e8dcc4]">
          <h2 className="font-heading text-lg font-bold text-[#2D2926]">
            Sign in to submit
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F5EDE0] transition-colors text-[#2D2926]/50 hover:text-[#2D2926]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e8dcc4]">
          {(['signin', 'new-vendor'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'text-[#C96B4A] border-b-2 border-[#C96B4A]'
                  : 'text-[#2D2926]/50 hover:text-[#2D2926]'
              }`}
            >
              {t === 'signin' ? 'Sign In' : "I'm a new vendor"}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} noValidate className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="modal-email" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Email Address
                </label>
                <input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30"
                  placeholder="ahmed@company.ae"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="modal-password" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Password
                </label>
                <input
                  id="modal-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C96B4A] hover:bg-[#B85C3B] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                ) : (
                  'Sign In & Continue'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full bg-[#C96B4A]/10 flex items-center justify-center mx-auto">
                <ShoppingBag size={24} className="text-[#C96B4A]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D2926] mb-1">Vendor accounts require approval.</p>
                <p className="text-sm text-[#2D2926]/60">
                  Please request access to get started. Our team approves qualified vendors within 24–48 hours.
                </p>
              </div>
              <Link
                href="/request-access"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-[#C96B4A] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#B85C3B] transition-colors text-sm"
              >
                Request Vendor Access
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Attribute badge ───────────────────────────────────────────────
function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full bg-[#F5EDE0] text-[#2D2926]/70 text-[11px] font-medium border border-[#e8dcc4]">
      {label}
    </span>
  )
}

// ── Item Row ─────────────────────────────────────────────────────
function ItemRow({ item, onQtyChange, onRemoveRequest }: {
  item: BasketItem
  onQtyChange: (id: string, qty: number) => void
  onRemoveRequest: (item: BasketItem) => void
}) {
  const effectiveColorHex = item.customColorHex ?? item.colorHex
  const effectiveTextureImg = item.customTextureImageUrl ?? item.textureImageUrl
  const filledDims = item.customDimensions?.filter(d => d.label && d.value) ?? []

  return (
    <div className="py-5 border-b border-[#e8dcc4] last:border-0 space-y-3">

      {/* Top row: name + price */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#2D2926] text-sm">{item.productName}</p>
          {/* Variant name + specs */}
          {item.variantName && (
            <p className="text-xs text-[#2D2926]/50 mt-0.5">{item.variantName}</p>
          )}
          {item.variantSpecs && item.variantSpecs.filter(s => s.value != null).length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-0 mt-0.5">
              {item.variantSpecs.filter(s => s.value != null).map((s, i) => (
                <span key={i} className="text-[11px] text-[#2D2926]/50">
                  <span className="font-medium">{s.name}:</span> {s.value}{s.unit ? ` ${s.unit}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.variantPrice != null && (
            <span className="text-sm font-bold text-[#C96B4A]">
              AED {Number(item.variantPrice).toLocaleString()}
            </span>
          )}
          {/* Remove */}
          <button
            onClick={() => onRemoveRequest(item)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#2D2926]/30 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Middle row: visual attributes */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Color circle */}
        {effectiveColorHex && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-6 h-6 rounded-full border-2 border-white shadow-md flex-shrink-0"
              style={{ backgroundColor: effectiveColorHex }}
              title={item.colorName}
            />
            <span className="text-[11px] text-[#2D2926]/60 font-medium">
              {item.customColorRal ? `RAL ${item.customColorRal}` : item.colorName}
            </span>
          </div>
        )}
        {!effectiveColorHex && item.colorName && (
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[#D9D0C7] border-2 border-white shadow-sm flex-shrink-0" />
            <span className="text-[11px] text-[#2D2926]/60 font-medium">{item.colorName}</span>
          </div>
        )}

        {/* Texture circle */}
        {effectiveTextureImg ? (
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full border-2 border-white shadow-md flex-shrink-0 overflow-hidden">
              <img src={effectiveTextureImg} alt={item.textureName} className="w-full h-full object-cover" />
            </span>
            <span className="text-[11px] text-[#2D2926]/60 font-medium">{item.textureName}</span>
          </div>
        ) : item.textureName ? (
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-[#C4B49A] border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">{item.textureName.slice(0,2).toUpperCase()}</span>
            </span>
            <span className="text-[11px] text-[#2D2926]/60 font-medium">{item.textureName}</span>
          </div>
        ) : null}

        {/* Finish */}
        {item.finishName && <Badge label={item.finishName} />}

        {/* Holes */}
        {item.holesOption && (
          <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            item.holesOption === 'with_holes'
              ? 'border-blue-300 text-blue-700 bg-blue-50'
              : 'border-[#D9D0C7] text-[#2D2926]/60'
          }`}>
            {item.holesOption === 'with_holes' ? 'With Holes' : 'Without Holes'}
          </span>
        )}
      </div>

      {/* Custom dimensions detail */}
      {item.isCustom && filledDims.length > 0 && (
        <div className="bg-[#F5EDE0] rounded-lg px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] font-semibold text-[#C96B4A] uppercase tracking-wide">Custom Dimensions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            {filledDims.map(d => (
              <div key={d.id} className="flex items-baseline gap-1">
                <span className="text-[11px] font-semibold text-[#2D2926]">{d.label}</span>
                <span className="text-[11px] text-[#2D2926]/60">{d.value} {d.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {item.isCustom && filledDims.length === 0 && (
        <Badge label="Custom Size" />
      )}

      {/* Bottom row: qty stepper */}
      <div className="flex items-center gap-2">
        <div className="flex items-center border border-[#e8dcc4] rounded-lg overflow-hidden">
          <button
            onClick={() => onQtyChange(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center text-[#2D2926]/50 hover:bg-[#F5EDE0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus size={11} />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-[#2D2926]">{item.quantity}</span>
          <button
            onClick={() => onQtyChange(item.id, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center text-[#2D2926]/50 hover:bg-[#F5EDE0] transition-colors"
            aria-label="Increase quantity"
          >
            <Plus size={11} />
          </button>
        </div>
        <span className="text-[11px] text-[#2D2926]/40">qty</span>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export default function EnquiryPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { items, count, updateQty, remove, clear } = useBasket()

  // Form state
  const [projectName, setProjectName]         = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes]                     = useState('')

  // UI state
  const [showAuthModal, setShowAuthModal]       = useState(false)
  const [submitting, setSubmitting]             = useState(false)
  const [submitError, setSubmitError]           = useState<string | null>(null)
  const [pendingDelete, setPendingDelete]        = useState<BasketItem | null>(null)

  async function doSubmit() {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/rfp/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectLocation,
          deliveryAddress,
          notes,
          items: items.map(item => {
            // Serialize dynamic fields into notes for the RFP
            const dimNote = item.customDimensions
              ?.filter(d => d.label && d.value)
              .map(d => `${d.label}: ${d.value} ${d.unit}`)
              .join(', ')
            const holesNote = item.holesOption === 'with_holes' ? 'With Holes'
              : item.holesOption === 'without_holes' ? 'Without Holes'
              : null
            const colorNote = item.customColorHex
              ? [
                  item.customColorRal ? `RAL ${item.customColorRal}` : null,
                  item.colorName,
                  item.customColorHex.toUpperCase(),
                ].filter(Boolean).join(' ')
              : null
            const combinedNotes = [dimNote, holesNote, colorNote, item.notes].filter(Boolean).join(' | ') || null

            return {
              productId:    item.productId    ?? null,
              productSku:   item.productSku   ?? null,
              productName:  item.productName,
              variantName:  item.variantName  ?? null,
              variantPrice: item.variantPrice ?? null,
              colorName:    item.colorName    ?? null,
              textureName:  item.textureName  ?? null,
              finishName:   item.finishName   ?? null,
              colorId:      item.colorId      ?? null,
              textureId:    item.textureId    ?? null,
              finishId:     item.finishId     ?? null,
              dimensionId:  item.dimensionId  ?? null,
              isCustom:     item.isCustom,
              quantity:     item.quantity,
              notes:        combinedNotes,
            }
          }),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? 'Failed to submit enquiry. Please try again.')
        setSubmitting(false)
        return
      }

      clear()
      router.push(`/portal/rfp/${data.data.id}`)
    } catch {
      setSubmitError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  function handleSubmitClick() {
    if (!session) {
      setShowAuthModal(true)
      return
    }
    doSubmit()
  }

  function handleAuthSuccess() {
    setShowAuthModal(false)
    doSubmit()
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#F5EDE0] px-4">
        <div className="text-center py-24">
          <ShoppingBag className="w-16 h-16 text-[#C96B4A]/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#2D2926] mb-2">Your basket is empty</h2>
          <p className="text-[#2D2926]/60 mb-6">Browse our catalogue and add products to get started</p>
          <Link
            href="/#products"
            className="inline-flex items-center gap-2 bg-[#C96B4A] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#B85C3B] transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          productName={pendingDelete.productName}
          onConfirm={() => { remove(pendingDelete.id); setPendingDelete(null) }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <div className="min-h-screen bg-[#F5EDE0] pt-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#C96B4A] mb-1">Enquiry Basket</p>
            <h1 className="font-heading text-3xl font-bold text-[#2D2926]">Review Your Enquiry</h1>
            <p className="text-[#2D2926]/60 mt-1 text-sm">
              {count} item{count !== 1 ? 's' : ''} ready to submit
            </p>
          </div>

          {/* ── Process Journey Banner ── */}
          <div className="mb-8 rounded-2xl border border-[#E8DDD0] bg-white overflow-hidden">
            <div className="grid grid-cols-4">
              {[
                { step: '01', icon: '🛍️', label: 'Add Products',    desc: 'Build your basket',          active: true  },
                { step: '02', icon: '📋', label: 'Submit Enquiry',  desc: 'Fill in project info',       active: true  },
                { step: '03', icon: '✉️', label: 'Receive a Quote', desc: 'We review & price within 24h', active: false },
                { step: '04', icon: '✅', label: 'Approve & Produce',desc: 'Accept to start production', active: false },
              ].map((s, i, arr) => (
                <div
                  key={i}
                  className={[
                    'relative flex flex-col items-center text-center px-4 py-5',
                    i < arr.length - 1 ? 'border-r border-[#E8DDD0]' : '',
                    s.active ? 'bg-[#FDF8F3]' : '',
                  ].join(' ')}
                >
                  {/* Active indicator strip */}
                  {s.active && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C96B4A]" />
                  )}
                  <span className="text-xl mb-2 leading-none">{s.icon}</span>
                  <p className={`text-[9px] font-bold tracking-[0.15em] uppercase mb-1 ${s.active ? 'text-[#C96B4A]' : 'text-[#2D2926]/25'}`}>
                    Step {s.step}
                  </p>
                  <p className={`text-xs font-bold leading-snug ${s.active ? 'text-[#2D2926]' : 'text-[#2D2926]/35'}`}>
                    {s.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 leading-snug hidden sm:block ${s.active ? 'text-[#2D2926]/55' : 'text-[#2D2926]/25'}`}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* ── LEFT: Item list ── */}
            <div className="bg-white rounded-2xl border border-[#e8dcc4] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8dcc4]">
                <h2 className="font-semibold text-[#2D2926] text-sm uppercase tracking-wide">
                  Items ({items.length})
                </h2>
              </div>

              <div className="px-6">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onQtyChange={updateQty}
                    onRemoveRequest={setPendingDelete}
                  />
                ))}
              </div>

              <div className="px-6 py-4 border-t border-[#e8dcc4] bg-[#F5EDE0]/30">
                <Link
                  href="/#products"
                  className="text-sm text-[#C96B4A] font-semibold hover:underline"
                >
                  + Add more items
                </Link>
              </div>
            </div>

            {/* ── RIGHT: Summary + form ── */}
            <div className="bg-white border border-[#e8dcc4] rounded-2xl p-6 space-y-4 lg:sticky lg:top-24">
              <h2 className="font-heading font-bold text-[#2D2926] text-lg">Project Details</h2>

              {submitError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Project Name */}
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Downtown Hotel Lobby"
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30"
                />
              </div>

              {/* Project Location */}
              <div>
                <label htmlFor="project-location" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Project Location
                </label>
                <input
                  id="project-location"
                  type="text"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  placeholder="e.g. Dubai Marina, UAE"
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30"
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label htmlFor="delivery-address" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Delivery Address
                </label>
                <textarea
                  id="delivery-address"
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Full delivery address"
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-[#2D2926] mb-1.5">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or project notes"
                  className="w-full px-3.5 py-2.5 border border-[#e8dcc4] rounded-xl text-sm bg-[#F5EDE0]/40 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] transition-colors placeholder:text-[#2D2926]/30 resize-none"
                />
              </div>

              {/* Summary count */}
              <div className="pt-2 border-t border-[#e8dcc4]">
                <p className="text-sm text-[#2D2926]/60">
                  <span className="font-semibold text-[#2D2926]">{count}</span>{' '}
                  item{count !== 1 ? 's' : ''} in this enquiry
                </p>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitClick}
                disabled={items.length === 0 || submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#C96B4A] hover:bg-[#B85C3B] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                ) : (
                  'Submit Enquiry →'
                )}
              </button>

              {!session && (
                <p className="text-xs text-center text-[#2D2926]/40">
                  You'll be asked to sign in before submitting
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
