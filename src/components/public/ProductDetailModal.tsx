'use client'

import { useState } from 'react'
import { X, FileText, Download, Image } from 'lucide-react'

interface ProductModalProps {
  product: {
    sku: string
    name: string
    category: string
    description: string
    dimensions: string[]
    colors: string[]
    textures: string[]
    finishes: string[]
  }
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedDim, setSelectedDim] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-cream rounded-lg transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-charcoal-600" />
          </button>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Visual */}
            <div className="bg-gradient-to-br from-terra-50 to-terra-100 rounded-lg h-96 flex items-end justify-center pb-8 relative">
              <div className="text-center text-terra-400">
                <p className="text-sm">{product.name}</p>
                <p className="text-xs mt-1">Visual representation</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <span className="badge badge-terra text-xs">{product.category}</span>
                <h2 className="text-3xl font-bold text-charcoal-900 mt-2">{product.name}</h2>
                <p className="text-charcoal-600 text-sm mt-2">{product.description}</p>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-bold text-charcoal-900 mb-3">
                  Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {product.dimensions.map((dim, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedDim(idx)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDim === idx
                          ? 'border-terra-600 bg-terra-50 text-terra-900'
                          : 'border-charcoal-200 text-charcoal-600 hover:border-terra-300'
                      }`}
                    >
                      {dim}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-bold text-charcoal-900 mb-3">
                  Colors ({product.colors.length} available)
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(idx)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border-2 ${
                        selectedColor === idx
                          ? 'border-terra-600 bg-terra-50'
                          : 'border-charcoal-200 hover:border-terra-300'
                      }`}
                      title={color}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textures & Finishes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 mb-2">
                    Textures ({product.textures.length})
                  </label>
                  <p className="text-xs text-charcoal-600">
                    {product.textures.join(', ')}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-900 mb-2">
                    Finishes ({product.finishes.length})
                  </label>
                  <p className="text-xs text-charcoal-600">
                    {product.finishes.join(', ')}
                  </p>
                </div>
              </div>

              {/* Technical Downloads */}
              <div className="border-t border-charcoal-100 pt-4">
                <label className="block text-sm font-bold text-charcoal-900 mb-3">
                  📋 Technical Details
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* PDF Download */}
                  <a
                    href={`/downloads/${product.sku}-technical-specs.pdf`}
                    download
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-terra-300 rounded-lg hover:bg-terra-50 transition-all group cursor-pointer"
                    title="Download PDF specifications"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-xs font-semibold text-charcoal-900">PDF Specs</span>
                    <span className="text-[10px] text-charcoal-500 mt-0.5">Download</span>
                  </a>

                  {/* AutoCAD Download */}
                  <a
                    href={`/downloads/${product.sku}-autocad.dwg`}
                    download
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-all group cursor-pointer"
                    title="Download AutoCAD drawing"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3V3m2 2v14h14V5H5m3 3h2v2H8V8m4 0h2v2h-2V8m4 0h2v2h-2V8m-8 4h2v2H8v-2m4 0h2v2h-2v-2m4 0h2v2h-2v-2" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-charcoal-900">AutoCAD</span>
                    <span className="text-[10px] text-charcoal-500 mt-0.5">DWG File</span>
                  </a>

                  {/* PNG Download */}
                  <a
                    href={`/downloads/${product.sku}-render.png`}
                    download
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-sage-300 rounded-lg hover:bg-sage-50 transition-all group cursor-pointer"
                    title="Download PNG image"
                  >
                    <div className="w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-sage-200 transition-colors">
                      <Image className="w-6 h-6 text-sage-600" />
                    </div>
                    <span className="text-xs font-semibold text-charcoal-900">PNG Image</span>
                    <span className="text-[10px] text-charcoal-500 mt-0.5">Render</span>
                  </a>
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4 border-t border-charcoal-100">
                <p className="text-xs text-charcoal-600 mb-4">
                  To customize and order, please request vendor access to our portal.
                </p>
                <a
                  href="/request-access"
                  className="btn-primary w-full text-center"
                >
                  Request Vendor Access
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
