'use client'

import Image    from 'next/image'
import { useState, useRef } from 'react'

interface Props {
  imageUrl:    string
  productName: string
  sku?:        string | null
}

export function ProductImagePopover({ imageUrl, productName, sku }: Props) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef      = useRef<HTMLDivElement>(null)

  function handleMouseEnter() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    // Centre popup above the trigger; popup is 180px wide + ~52px label = ~232px tall
    setPos({
      top:  rect.top  + window.scrollY - 244,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setOpen(true)
  }

  return (
    <>
      {/* Trigger — the 56×56 image tile */}
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-cream border border-[#E8E0D5] cursor-zoom-in"
      >
        <Image
          src={imageUrl}
          alt={productName}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Fixed popup above trigger */}
      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
        >
          <div className="w-44 rounded-2xl overflow-hidden shadow-card-lg border border-[#E8E0D5] bg-white animate-fade-up">
            {/* Image */}
            <div className="w-full aspect-square relative">
              <Image
                src={imageUrl}
                alt={productName}
                fill
                sizes="176px"
                className="object-cover"
              />
            </div>
            {/* Label */}
            <div className="px-3 py-2.5 border-t border-[#E8E0D5]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400 mb-0.5">Product</p>
              <p className="text-xs font-semibold text-charcoal-900 leading-snug">{productName}</p>
              {sku && <p className="font-mono text-[10px] text-charcoal-300 mt-0.5">{sku}</p>}
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 bg-white border-r border-b border-[#E8E0D5] rotate-45" />
          </div>
        </div>
      )}
    </>
  )
}
