'use client'

import { useEffect, useRef, useState } from 'react'
import { Package, ZoomIn } from 'lucide-react'

interface GalleryImage {
  id: string
  url: string
  alt?: string | null
}

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

/* ── Single image slot ─────────────────────────────────────────── */
function ImageSlot({
  src, alt, productName, index, total, mode,
}: {
  src?: string; alt: string; productName: string
  index: number; total: number; mode: 'main' | 'thumb'
}) {
  const [failed, setFailed] = useState(!src)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!src) { setFailed(true); return }
    const img = ref.current
    if (img?.complete && img.naturalWidth === 0) setFailed(true)
  }, [src])

  if (failed || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-cream to-cream-darker flex items-center justify-center">
        {mode === 'main' ? (
          <div className="text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-charcoal-200" />
            <p className="text-xs text-charcoal-300 font-medium">{productName}</p>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-charcoal-300">{index + 1}</span>
        )}
      </div>
    )
  }

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
      onLoad={e => { if (e.currentTarget.naturalWidth === 0) setFailed(true) }}
    />
  )
}

/* ── Lightbox ──────────────────────────────────────────────────── */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] bg-charcoal-900 backdrop-blur-md flex items-center justify-center p-8 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/* ── Main Gallery ──────────────────────────────────────────────── */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : [{ id: 'empty', url: '', alt: null }]
  const [currentIdx, setCurrentIdx]   = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const total   = gallery.length
  const current = gallery[currentIdx] ?? gallery[0]

  return (
    <>
      <div className="space-y-3">
        {/* ── Main image ─────────────────────────── */}
        <div
          className="group relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-cream cursor-zoom-in"
          onClick={() => current.url && setLightboxSrc(current.url)}
        >
          <ImageSlot
            src={current.url}
            alt={current.alt || productName}
            productName={productName}
            index={currentIdx}
            total={total}
            mode="main"
          />

          {/* Zoom hint */}
          {current.url && (
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ZoomIn className="w-4 h-4 text-charcoal-600" />
            </div>
          )}

          {/* Counter pill */}
          {total > 1 && (
            <div className="absolute bottom-3 right-3 bg-charcoal-900/60 text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider backdrop-blur-sm">
              {currentIdx + 1} / {total}
            </div>
          )}
        </div>

        {/* ── Thumbnails ─────────────────────────── */}
        {total > 1 && (
          <div className="flex gap-2 flex-wrap">
            {gallery.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setCurrentIdx(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-[3/4] w-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIdx
                    ? 'border-terra-600 ring-1 ring-terra-600'
                    : 'border-charcoal-200 hover:border-charcoal-300'
                }`}
              >
                <ImageSlot
                  src={img.url}
                  alt={img.alt || `${productName} ${i + 1}`}
                  productName={productName}
                  index={i}
                  total={total}
                  mode="thumb"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={current.alt || productName}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  )
}
