'use client'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useBasket } from '@/lib/basket/useBasket'

export function BasketIcon() {
  const { count } = useBasket()
  return (
    <Link href="/enquiry" className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#C96B4A]/10 transition-colors group">
      <ShoppingBag className="w-5 h-5 text-[#2D2926] group-hover:text-[#C96B4A] transition-colors" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C96B4A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
