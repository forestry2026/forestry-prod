'use client'

import { useState, useTransition } from 'react'
import { Trash2, X } from 'lucide-react'

interface Props {
  itemId:       string
  productName:  string
  removeAction: (id: string) => Promise<void>
}

export function RemoveItemButton({ itemId, productName, removeAction }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal]    = useState(false)

  function handleConfirm() {
    setShowModal(false)
    startTransition(() => removeAction(itemId))
  }

  return (
    <>
      {/* Trash trigger */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isPending}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-rose-500 hover:bg-rose-50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Remove item"
        aria-label="Remove item from enquiry"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Confirm modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#E8E0D5]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#E8E0D5]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="font-heading text-base font-bold text-[#2D2926]">Remove item?</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-charcoal-300 hover:text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm text-[#2D2926]/60 leading-relaxed">
                <span className="font-semibold text-[#2D2926]">{productName}</span> will be removed from your enquiry basket.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-[#E8E0D5] text-sm font-semibold text-[#2D2926] hover:bg-[#F5EDE0] hover:border-[#C96B4A]/30 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
