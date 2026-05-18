'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Building2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Props {
  initialLogoUrl: string | null
  companyName:    string
}

export function VendorLogoUpload({ initialLogoUrl, companyName }: Props) {
  const [logoUrl,    setLogoUrl]    = useState<string | null>(initialLogoUrl)
  // Start stable to match SSR; bump after mount to bust browser cache.
  const [bust,       setBust]       = useState(0)
  useEffect(() => { setBust(Date.now()) }, [])
  const [uploading,  setUploading]  = useState(false)
  const [removing,   setRemoving]   = useState(false)
  const [toast,      setToast]      = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [dragOver,   setDragOver]   = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  async function upload(file: File) {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      return showToast('err', 'Only PNG, JPG, WebP or SVG allowed')
    }
    if (file.size > 2 * 1024 * 1024) return showToast('err', 'File too large — max 2 MB')

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/vendor/profile/logo', { method: 'POST', body: fd })
      let data: any = {}
      try { data = await res.json() } catch { /* non-JSON body */ }
      if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status})`)
      // Strip server-side ?t= and apply local bust so img key changes every upload
      const cleanUrl = (data.logoUrl as string).split('?')[0]
      setLogoUrl(cleanUrl)
      setBust(Date.now())
      showToast('ok', 'Logo updated')
    } catch (e: any) {
      showToast('err', e.message)
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    setRemoving(true)
    try {
      const res = await fetch('/api/vendor/profile/logo', { method: 'DELETE' })
      if (!res.ok) throw new Error('Remove failed')
      setLogoUrl(null)
      showToast('ok', 'Logo removed')
    } catch {
      showToast('err', 'Could not remove logo')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
      {/* Section label */}
      <div className="px-5 py-3 border-b border-[#F0EBE3] bg-cream/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Company Logo</p>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-5">

          {/* Logo preview / drop zone */}
          <div
            onDragOver={e  => { e.preventDefault(); setDragOver(true)  }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false)
              const f = e.dataTransfer.files[0]
              if (f) upload(f)
            }}
            onClick={() => !logoUrl && inputRef.current?.click()}
            className={`relative w-24 h-24 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 overflow-hidden transition-all duration-200 ${
              logoUrl
                ? 'border-[#E8E0D5] bg-white cursor-default'
                : dragOver
                  ? 'border-terracotta bg-terracotta/5 cursor-pointer scale-[1.02]'
                  : 'border-dashed border-charcoal-200 bg-cream/60 hover:border-terracotta/60 hover:bg-terracotta/5 cursor-pointer'
            }`}
          >
            {logoUrl ? (
              <img
                key={bust}
                src={`${logoUrl}?v=${bust}`}
                alt={companyName}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-center px-2">
                <Building2 className="w-6 h-6 text-charcoal-300" />
                <p className="text-[9px] font-semibold text-charcoal-300 leading-tight">Drop or click</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-terracotta animate-spin" />
              </div>
            )}
          </div>

          {/* Actions + info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-charcoal-900 mb-0.5 truncate">{companyName}</p>
            <p className="text-xs text-charcoal-400 mb-3">PNG, JPG, WebP or SVG · max 2 MB</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading || removing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold rounded-xl transition-colors shadow-warm-sm disabled:opacity-50"
              >
                {uploading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload  className="w-3.5 h-3.5" />
                }
                {logoUrl ? 'Replace' : 'Upload logo'}
              </button>
              {logoUrl && (
                <button
                  onClick={removeLogo}
                  disabled={uploading || removing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E8E0D5] text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {removing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2  className="w-3.5 h-3.5" />
                  }
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-5 mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
          toast.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {toast.type === 'ok'
            ? <CheckCircle2  className="w-3.5 h-3.5 flex-shrink-0" />
            : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
