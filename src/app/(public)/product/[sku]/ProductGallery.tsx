'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GalleryImage {
  url: string
  alt?: string
  isPrimary?: boolean
}

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const primaryIdx = images.findIndex(i => i.isPrimary)
  const [currentImageIndex, setCurrentImageIndex] = useState(primaryIdx >= 0 ? primaryIdx : 0)

  if (!images.length) {
    return (
      <div className="aspect-[3/4] bg-gradient-to-br from-[#F0E6DA] to-[#DEC4AA] rounded-xl flex items-center justify-center">
        <p className="text-sm font-medium text-charcoal-400">{productName}</p>
      </div>
    )
  }

  const current = images[currentImageIndex]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative w-full">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cream group">
          <img
            src={current.url}
            alt={current.alt || productName}
            className="w-full h-full object-cover"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative aspect-[3/4] w-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImageIndex
                  ? 'border-terra-600 ring-1 ring-terra-600'
                  : 'border-charcoal-200 hover:border-charcoal-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img src={img.url} alt={img.alt || `${productName} ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
