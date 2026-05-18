'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  isFeatured: boolean
  imageUrl: string | null
  category: string | null
}

interface Props {
  products: Product[]
}

function MiniPot() {
  return (
    <div className="relative">
      <div className="absolute -top-2.5 -left-3 -right-3 h-5 bg-gradient-to-r from-[#C4683A] to-[#B35C2A] rounded-sm" />
      <div className="w-16 h-24 bg-gradient-to-br from-[#C4683A] via-[#B35C2A] to-[#8B4520] rounded-t-none rounded-b-xl shadow-lg" />
    </div>
  )
}

export function ProductCarousel({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft,  setCanScrollLeft]  = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  function scrollBy(dir: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.7
    el.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy('left')}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-8 -translate-x-4 z-10
                     w-11 h-11 rounded-full bg-white border border-[#E8E0D5] shadow-card
                     flex items-center justify-center text-charcoal-700
                     hover:bg-terracotta hover:text-white hover:border-terracotta
                     transition-all duration-200"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scrollBy('right')}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-8 translate-x-4 z-10
                     w-11 h-11 rounded-full bg-white border border-[#E8E0D5] shadow-card
                     flex items-center justify-center text-charcoal-700
                     hover:bg-terracotta hover:text-white hover:border-terracotta
                     transition-all duration-200"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Card track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-6 lg:-mx-8 px-6 lg:px-8"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.sku}`}
            className="card-hover group overflow-hidden text-left flex-shrink-0 w-[260px] snap-start"
            aria-label={`View details for ${product.name}`}
          >
            {/* Image */}
            <div className="aspect-[9/13] bg-gradient-to-br from-[#F0E6DA] to-[#DEC4AA] relative overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-end justify-center pb-5">
                  <MiniPot />
                </div>
              )}
              {product.isFeatured && (
                <span className="absolute top-3 left-3 px-2 py-0.5 bg-terracotta text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                  Featured
                </span>
              )}
            </div>
            <div className="p-5">
              {product.category && (
                <span className="badge-sage text-[11px] mb-2">{product.category}</span>
              )}
              <h3 className="font-heading font-semibold text-base text-[#1C1C1C] mb-3">
                {product.name}
              </h3>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-terracotta group-hover:gap-3 transition-all duration-200">
                View Details
                <ArrowRight size={15} aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
