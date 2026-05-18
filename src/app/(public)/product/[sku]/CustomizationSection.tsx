'use client'

import { useState } from 'react'

interface SpecItem {
  name: string
  value: number | null
  unit?: string
}

interface VariantGroup {
  id: string
  name: string
  price?: number | null
  specifications: SpecItem[]
}

interface ColorOption {
  id: string
  name: string
  hexCode?: string | null
}

interface TextureOption {
  id: string
  name: string
  imageUrl?: string | null
}

interface FinishOption {
  id: string
  name: string
}

interface CustomizationSectionProps {
  variants: VariantGroup[]
  colors: ColorOption[]
  textures: TextureOption[]
  finishes: FinishOption[]
}

export default function CustomizationSection({
  variants = [],
  colors = [],
  textures = [],
  finishes = [],
}: CustomizationSectionProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(variants[0]?.id ?? null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedTexture, setSelectedTexture] = useState<string | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<string | null>(null)

  const activeVariant = variants.find(v => v.id === selectedVariant)

  return (
    <div className="space-y-4">

      {/* VARIANT / SIZE SECTION */}
      {variants.length > 0 && (
        <div className="bg-white rounded-lg border border-charcoal-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-charcoal-900 text-sm uppercase tracking-wide">Size / Variant</h3>
              <p className="text-xs text-charcoal-500 mt-1">Choose your preferred dimensions</p>
            </div>
            {activeVariant?.price != null && (
              <span className="text-sm font-bold text-terra-600 bg-terra-50 px-3 py-1 rounded-full">
                AED {Number(activeVariant.price).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`min-h-10 px-3 py-2 border-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer text-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terra-600 ${
                  selectedVariant === v.id
                    ? 'border-terra-600 bg-terra-50 text-terra-900'
                    : 'border-charcoal-200 text-charcoal-900 hover:border-terra-400'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Variant specs breakdown */}
          {activeVariant && activeVariant.specifications.filter(s => s.value != null).length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-charcoal-100">
              {activeVariant.specifications.filter(s => s.value != null).map((s, i) => (
                <span key={i} className="text-xs text-charcoal-600">
                  <span className="font-semibold text-charcoal-900">{s.name}:</span>{' '}
                  {s.value}{s.unit ? ` ${s.unit}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COLOR SECTION */}
      {colors.length > 0 && (
        <div className="bg-white rounded-lg border border-charcoal-100 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-charcoal-900 text-sm uppercase tracking-wide">Color</h3>
              <p className="text-xs text-charcoal-500 mt-1">Select from {colors.length} option{colors.length !== 1 ? 's' : ''}</p>
            </div>
            {selectedColor && (
              <span className="text-xs font-semibold text-terra-600 bg-terra-50 px-2 py-1 rounded-full flex-shrink-0">
                {colors.find(c => c.id === selectedColor)?.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color.id}
                onClick={() => setSelectedColor(color.id)}
                title={color.name}
                aria-label={`Select ${color.name}`}
                aria-pressed={selectedColor === color.id}
                className={`w-9 h-9 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terra-600 flex-shrink-0 overflow-hidden ${
                  selectedColor === color.id
                    ? 'border-terra-600 ring-2 ring-terra-300 shadow-md'
                    : 'border-charcoal-200 hover:border-charcoal-300'
                }`}
                style={{ backgroundColor: color.hexCode ?? '#cccccc' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* TEXTURE SECTION */}
      {textures.length > 0 && (
        <div className="bg-white rounded-lg border border-charcoal-100 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-charcoal-900 text-sm uppercase tracking-wide">Texture</h3>
              <p className="text-xs text-charcoal-500 mt-1">Select from {textures.length} option{textures.length !== 1 ? 's' : ''}</p>
            </div>
            {selectedTexture && (
              <span className="text-xs font-semibold text-terra-600 bg-terra-50 px-2 py-1 rounded-full flex-shrink-0">
                {textures.find(t => t.id === selectedTexture)?.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {textures.map(texture => (
              <button
                key={texture.id}
                onClick={() => setSelectedTexture(texture.id)}
                title={texture.name}
                aria-label={`Select ${texture.name} texture`}
                aria-pressed={selectedTexture === texture.id}
                className={`w-9 h-9 rounded-xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terra-600 flex-shrink-0 overflow-hidden ${
                  selectedTexture === texture.id
                    ? 'border-terra-600 ring-2 ring-terra-300 shadow-md'
                    : 'border-charcoal-200 hover:border-charcoal-300'
                }`}
              >
                {texture.imageUrl ? (
                  <img src={texture.imageUrl} alt={texture.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full bg-charcoal-100 flex items-center justify-center text-[8px] font-bold text-charcoal-400 leading-tight text-center px-0.5">
                    {texture.name.slice(0, 3).toUpperCase()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FINISH SECTION */}
      {finishes.length > 0 && (
        <div className="bg-white rounded-lg border border-charcoal-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-charcoal-900 text-sm uppercase tracking-wide">Finish</h3>
              <p className="text-xs text-charcoal-500 mt-1">Select the protective coating</p>
            </div>
            {selectedFinish && (
              <span className="text-xs font-semibold text-terra-600 bg-terra-50 px-3 py-1 rounded-full">
                {finishes.find(f => f.id === selectedFinish)?.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {finishes.map(finish => (
              <button
                key={finish.id}
                onClick={() => setSelectedFinish(finish.id)}
                aria-label={`Select ${finish.name} finish`}
                aria-pressed={selectedFinish === finish.id}
                className={`min-h-10 px-3 py-2 border-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer text-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terra-600 ${
                  selectedFinish === finish.id
                    ? 'border-terra-600 bg-terra-50 text-terra-900'
                    : 'border-charcoal-200 text-charcoal-900 hover:border-terra-400'
                }`}
              >
                {finish.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUMMARY */}
      {(selectedVariant || selectedColor || selectedTexture || selectedFinish) && (
        <div className="bg-terra-50 rounded-lg border border-terra-200 p-4 space-y-2">
          <p className="text-xs font-semibold text-terra-900 uppercase tracking-wide">Your Selection</p>
          <div className="flex flex-wrap gap-2">
            {selectedVariant && (
              <div className="bg-white rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-900 border border-terra-300">
                Size: <span className="font-semibold">{variants.find(v => v.id === selectedVariant)?.name}</span>
              </div>
            )}
            {selectedColor && (
              <div className="bg-white rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-900 border border-terra-300">
                Color: <span className="font-semibold">{colors.find(c => c.id === selectedColor)?.name}</span>
              </div>
            )}
            {selectedTexture && (
              <div className="bg-white rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-900 border border-terra-300">
                Texture: <span className="font-semibold">{textures.find(t => t.id === selectedTexture)?.name}</span>
              </div>
            )}
            {selectedFinish && (
              <div className="bg-white rounded-full px-3 py-1.5 text-xs font-medium text-charcoal-900 border border-terra-300">
                Finish: <span className="font-semibold">{finishes.find(f => f.id === selectedFinish)?.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
