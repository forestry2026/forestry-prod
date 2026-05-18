'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Upload, Eye, EyeOff, Loader2, ImageIcon, X } from 'lucide-react'

interface Banner {
  id:        string
  imageUrl:  string
  isActive:  boolean
  sortOrder: number
}

interface Props { initialBanners: Banner[] }

/* ── Upload modal ──────────────────────────────────────────────── */
function UploadModal({ onClose, onSave }: { onClose: () => void; onSave: (b: Banner) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [imageUrl,  setImageUrl]  = useState('')
  const [isActive,  setIsActive]  = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [imgErr,    setImgErr]    = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    setImgErr(false)
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/hero-banners/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.imageUrl) setImageUrl(data.imageUrl)
    else setError('Upload failed')
    setUploading(false)
  }

  async function handleSave() {
    if (!imageUrl) { setError('Upload an image first'); return }
    setSaving(true)
    setError('')
    const res  = await fetch('/api/hero-banners', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ imageUrl, isActive, sortOrder }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) onSave(data.data)
    else setError(data.error ?? 'Save failed')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D5]">
          <h2 className="font-heading font-bold text-lg text-charcoal-900">Add Hero Image</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
            <X className="w-4 h-4 text-charcoal-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Upload zone */}
          <div>
            <label className="block text-[12px] font-semibold text-charcoal-600 uppercase tracking-wide mb-2">
              Image (16:9 or wider recommended)
            </label>
            <div
              className="relative aspect-video rounded-xl overflow-hidden bg-cream-dark border-2 border-dashed border-[#E8E0D5] hover:border-terracotta/40 cursor-pointer transition-colors group"
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl && !imgErr ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={() => setImgErr(true)} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Upload className="w-8 h-8 text-charcoal-200 group-hover:text-terracotta/50 transition-colors" />
                  <span className="text-[12px] text-charcoal-300">Click to upload</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
                </div>
              )}
              {imageUrl && !imgErr && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-[12px] font-semibold bg-black/40 px-3 py-1.5 rounded-lg">Change image</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>

          {/* Sort order + active */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-[12px] font-semibold text-charcoal-600 uppercase tracking-wide mb-1.5">
                Sort Order
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <div
                onClick={() => setIsActive(v => !v)}
                className={`relative cursor-pointer rounded-full transition-colors ${isActive ? 'bg-terracotta' : 'bg-charcoal-200'}`}
                style={{ height: '22px', width: '40px' }}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] font-medium text-charcoal-700">Active</span>
            </label>
          </div>

          {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[#E8E0D5] flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-charcoal-600 hover:bg-cream rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !imageUrl}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold bg-terracotta text-white rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add banner
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Banner card ───────────────────────────────────────────────── */
function BannerCard({
  banner, onToggle, onDelete,
}: {
  banner:   Banner
  onToggle: (id: string, val: boolean) => void
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [imgErr,   setImgErr]   = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this hero image?')) return
    setDeleting(true)
    await fetch(`/api/hero-banners/${banner.id}`, { method: 'DELETE' })
    onDelete(banner.id)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-card transition-all ${banner.isActive ? 'border-[#E8E0D5]' : 'border-[#E8E0D5] opacity-55'}`}>
      {/* Image — landscape aspect */}
      <div className="relative aspect-video overflow-hidden bg-cream-dark">
        {!imgErr && banner.imageUrl ? (
          <img
            src={banner.imageUrl}
            alt="Hero banner"
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-charcoal-200" />
          </div>
        )}

        {/* Active badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.isActive ? 'bg-sage text-white' : 'bg-charcoal-200 text-charcoal-600'}`}>
          {banner.isActive ? 'Active' : 'Hidden'}
        </div>

        {/* Sort order badge */}
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white">
          #{banner.sortOrder}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 flex items-center gap-1.5">
        <button
          onClick={() => onToggle(banner.id, !banner.isActive)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 rounded-lg transition-colors"
        >
          {banner.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {banner.isActive ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function HeroBannersClient({ initialBanners }: Props) {
  const [banners,    setBanners]    = useState<Banner[]>(initialBanners)
  const [showModal,  setShowModal]  = useState(false)

  function handleSave(saved: Banner) {
    setBanners(prev => [...prev, saved])
    setShowModal(false)
  }

  async function handleToggle(id: string, val: boolean) {
    await fetch(`/api/hero-banners/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: val }),
    })
    setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: val } : b))
  }

  function handleDelete(id: string) {
    setBanners(prev => prev.filter(b => b.id !== id))
  }

  const active = banners.filter(b => b.isActive)
  const hidden = banners.filter(b => !b.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-charcoal-900">Hero Banners</h1>
          <p className="text-[13px] text-charcoal-400 mt-0.5">
            {active.length} active · {hidden.length} hidden · first active image shown on the landing page hero
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white text-[13px] font-bold rounded-xl hover:bg-terracotta-dark transition-colors shadow-warm-sm"
        >
          <Plus className="w-4 h-4" /> Add Image
        </button>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 bg-terracotta/5 border border-terracotta/20 rounded-xl px-4 py-3">
        <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
        <p className="text-[12px] text-charcoal-600 leading-relaxed">
          Images are shown as the full-screen background on the landing page. The headline text on the page stays fixed — only the background image changes.
          Sort order controls which image shows first.
        </p>
      </div>

      {/* Active banners */}
      {active.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">Active</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(b => (
              <BannerCard key={b.id} banner={b} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="aspect-video border-2 border-dashed border-[#E8E0D5] hover:border-terracotta/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-charcoal-300 hover:text-terracotta transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-cream-dark group-hover:bg-terracotta/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">Add image</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden banners */}
      {hidden.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">Hidden</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hidden.map(b => (
              <BannerCard key={b.id} banner={b} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {banners.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E8E0D5]">
          <div className="w-14 h-14 rounded-2xl bg-cream-dark flex items-center justify-center mb-4">
            <ImageIcon className="w-7 h-7 text-charcoal-200" />
          </div>
          <h3 className="font-heading font-bold text-lg text-charcoal-900 mb-1.5">No hero images yet</h3>
          <p className="text-[13px] text-charcoal-400 mb-5 text-center max-w-xs">
            Upload landscape images to display as the full-screen background on the landing page.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-[13px] font-bold rounded-xl hover:bg-terracotta-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add first image
          </button>
        </div>
      )}

      {showModal && (
        <UploadModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}
