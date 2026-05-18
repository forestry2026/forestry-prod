'use client'

import { useState, useRef } from 'react'
import {
  Plus, Trash2, Upload, Eye, EyeOff,
  GripVertical, Loader2, ImageIcon, Pencil, X, Check,
} from 'lucide-react'

interface Slide {
  id:        string
  imageUrl:  string
  headline:  string
  subtext:   string | null
  isActive:  boolean
  sortOrder: number
}

interface Props { initialSlides: Slide[] }

/* ── Empty image placeholder ───────────────────────────────────── */
function ImgPlaceholder() {
  return (
    <div className="w-full h-full bg-cream-dark flex items-center justify-center">
      <ImageIcon className="w-8 h-8 text-charcoal-200" />
    </div>
  )
}

/* ── Slide Card ────────────────────────────────────────────────── */
function SlideCard({
  slide, onToggle, onDelete, onEdit,
}: {
  slide:    Slide
  onToggle: (id: string, val: boolean) => void
  onDelete: (id: string) => void
  onEdit:   (slide: Slide) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [imgErr,   setImgErr]   = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this slide?')) return
    setDeleting(true)
    await fetch(`/api/login-slides/${slide.id}`, { method: 'DELETE' })
    onDelete(slide.id)
  }

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-card transition-all ${slide.isActive ? 'border-[#E8E0D5]' : 'border-[#E8E0D5] opacity-60'}`}>
      {/* Image */}
      <div className="relative aspect-[9/16] max-h-56 overflow-hidden bg-cream-dark group">
        {!imgErr && slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt={slide.headline}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : <ImgPlaceholder />}

        {/* Overlay with headline preview */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-charcoal-900/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="font-heading font-bold text-white text-sm leading-snug line-clamp-2">{slide.headline}</p>
          {slide.subtext && <p className="text-white/70 text-[11px] mt-0.5 line-clamp-1">{slide.subtext}</p>}
        </div>

        {/* Active badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${slide.isActive ? 'bg-sage text-white' : 'bg-charcoal-200 text-charcoal-600'}`}>
          {slide.isActive ? 'Active' : 'Hidden'}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <p className="font-heading font-bold text-[13px] text-charcoal-900 leading-snug line-clamp-2">{slide.headline}</p>
        {slide.subtext && <p className="text-[11px] text-charcoal-400 line-clamp-2">{slide.subtext}</p>}

        {/* Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => onEdit(slide)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onToggle(slide.id, !slide.isActive)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100 rounded-lg transition-colors"
          >
            {slide.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {slide.isActive ? 'Hide' : 'Show'}
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
    </div>
  )
}

/* ── Slide Form Modal ──────────────────────────────────────────── */
function SlideModal({
  slide, onClose, onSave,
}: {
  slide?:  Partial<Slide>
  onClose: () => void
  onSave:  (s: Slide) => void
}) {
  const isEdit = !!slide?.id
  const fileRef = useRef<HTMLInputElement>(null)

  const [imageUrl,  setImageUrl]  = useState(slide?.imageUrl  ?? '')
  const [headline,  setHeadline]  = useState(slide?.headline  ?? '')
  const [subtext,   setSubtext]   = useState(slide?.subtext   ?? '')
  const [isActive,  setIsActive]  = useState(slide?.isActive  ?? true)
  const [sortOrder, setSortOrder] = useState(slide?.sortOrder ?? 0)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [imgErr,    setImgErr]    = useState(false)

  async function handleUpload(file: File) {
    setUploading(true)
    setImgErr(false)
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/login-slides/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.imageUrl) setImageUrl(data.imageUrl)
    else setError('Upload failed')
    setUploading(false)
  }

  async function handleSave() {
    if (!imageUrl) { setError('Upload an image first'); return }
    if (!headline.trim()) { setError('Headline is required'); return }
    setSaving(true)
    setError('')

    const body = { imageUrl, headline: headline.trim(), subtext: subtext.trim() || null, isActive, sortOrder }
    const url  = isEdit ? `/api/login-slides/${slide!.id}` : '/api/login-slides'
    const res  = await fetch(url, {
      method:  isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) onSave(data.data)
    else setError(data.error ?? 'Save failed')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0D5]">
          <h2 className="font-heading font-bold text-lg text-charcoal-900">{isEdit ? 'Edit Slide' : 'New Slide'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream transition-colors">
            <X className="w-4 h-4 text-charcoal-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-[12px] font-semibold text-charcoal-600 uppercase tracking-wide mb-2">
              Image (9:16 recommended)
            </label>
            <div
              className="relative aspect-[9/16] max-h-64 rounded-xl overflow-hidden bg-cream-dark border-2 border-dashed border-[#E8E0D5] hover:border-terracotta/40 cursor-pointer transition-colors group"
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

          {/* Headline */}
          <div>
            <label className="block text-[12px] font-semibold text-charcoal-600 uppercase tracking-wide mb-1.5">
              Headline *
            </label>
            <input
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Every great space begins with…"
              className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50"
            />
          </div>

          {/* Subtext */}
          <div>
            <label className="block text-[12px] font-semibold text-charcoal-600 uppercase tracking-wide mb-1.5">
              Subtext
            </label>
            <textarea
              value={subtext}
              onChange={e => setSubtext(e.target.value)}
              placeholder="Optional supporting text…"
              rows={2}
              className="w-full px-3.5 py-2.5 text-[13px] bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 resize-none"
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
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${isActive ? 'bg-terracotta' : 'bg-charcoal-200'}`}
                style={{ height: '22px', width: '40px' }}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] font-medium text-charcoal-700">Active</span>
            </label>
          </div>

          {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5] flex items-center gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-charcoal-600 hover:bg-cream rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2 text-[13px] font-bold bg-terracotta text-white rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {isEdit ? 'Save changes' : 'Add slide'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function LoginSlidesClient({ initialSlides }: Props) {
  const [slides,      setSlides]      = useState<Slide[]>(initialSlides)
  const [modalSlide,  setModalSlide]  = useState<Partial<Slide> | null>(null)
  const [showModal,   setShowModal]   = useState(false)

  function openNew()           { setModalSlide({});    setShowModal(true) }
  function openEdit(s: Slide)  { setModalSlide(s);     setShowModal(true) }
  function closeModal()        { setShowModal(false);  setModalSlide(null) }

  function handleSave(saved: Slide) {
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    closeModal()
  }

  async function handleToggle(id: string, val: boolean) {
    await fetch(`/api/login-slides/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ isActive: val }),
    })
    setSlides(prev => prev.map(s => s.id === id ? { ...s, isActive: val } : s))
  }

  function handleDelete(id: string) {
    setSlides(prev => prev.filter(s => s.id !== id))
  }

  const active  = slides.filter(s => s.isActive)
  const hidden  = slides.filter(s => !s.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-charcoal-900">Login Slides</h1>
          <p className="text-[13px] text-charcoal-400 mt-0.5">
            {active.length} active · {hidden.length} hidden · randomly shown on the login screen
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white text-[13px] font-bold rounded-xl hover:bg-terracotta-dark transition-colors shadow-warm-sm"
        >
          <Plus className="w-4 h-4" /> Add Slide
        </button>
      </div>

      {/* Active slides */}
      {active.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">Active</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {active.map(s => (
              <SlideCard key={s.id} slide={s} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
            ))}
            {/* Add card */}
            <button
              onClick={openNew}
              className="aspect-[9/16] max-h-56 border-2 border-dashed border-[#E8E0D5] hover:border-terracotta/40 rounded-2xl flex flex-col items-center justify-center gap-2 text-charcoal-300 hover:text-terracotta transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-cream-dark group-hover:bg-terracotta/10 flex items-center justify-center transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold">Add slide</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden slides */}
      {hidden.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">Hidden</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {hidden.map(s => (
              <SlideCard key={s.id} slide={s} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {slides.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E8E0D5]">
          <div className="w-14 h-14 rounded-2xl bg-cream-dark flex items-center justify-center mb-4">
            <ImageIcon className="w-7 h-7 text-charcoal-200" />
          </div>
          <h3 className="font-heading font-bold text-lg text-charcoal-900 mb-1.5">No slides yet</h3>
          <p className="text-[13px] text-charcoal-400 mb-5">Add images and text to display on the login screen.</p>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-[13px] font-bold rounded-xl hover:bg-terracotta-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add first slide
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <SlideModal slide={modalSlide ?? {}} onClose={closeModal} onSave={handleSave} />
      )}
    </div>
  )
}
