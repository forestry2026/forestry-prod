'use client'

import Image    from 'next/image'
import { useState, useRef } from 'react'

interface Props {
  imageUrl: string
  name:     string
}

export function TexturePopover({ imageUrl, name }: Props) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const triggerRef      = useRef<HTMLSpanElement>(null)

  function handleMouseEnter() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top:  rect.top  + window.scrollY - 148,
      left: rect.left + window.scrollX + rect.width / 2,
    })
    setOpen(true)
  }

  return (
    <>
      {/* Trigger — small round thumbnail */}
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-black/10 shadow-sm cursor-zoom-in"
      >
        <Image src={imageUrl} alt={name} width={16} height={16} className="w-full h-full object-cover" />
      </span>

      {/* Fixed popup above trigger */}
      {open && (
        <span
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: 'translateX(-50%)' }}
        >
          <span className="block w-36 rounded-2xl overflow-hidden shadow-card-lg border border-[#E8E0D5] bg-white animate-fade-up">
            <span className="block w-full aspect-square relative">
              <Image src={imageUrl} alt={name} fill sizes="144px" className="object-cover" />
            </span>
            <span className="block px-3 py-2 border-t border-[#E8E0D5]">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-charcoal-400 mb-0.5">Texture</span>
              <span className="block text-xs font-semibold text-charcoal-900 truncate">{name}</span>
            </span>
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-[7px] w-3 h-3 bg-white border-r border-b border-[#E8E0D5] rotate-45" />
          </span>
        </span>
      )}
    </>
  )
}
