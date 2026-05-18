'use client'
import { useState, useEffect, useCallback } from 'react'

export interface CustomDimension {
  id: string      // client uuid for keying React list
  label: string   // e.g. "Top Dia", "Bottom Dia", "Height"
  value: string   // numeric string e.g. "400"
  unit: string    // e.g. "mm", "cm"
}

export interface BasketItem {
  id: string // client-generated uuid for localStorage
  productId?: string
  productSku?: string
  productName: string
  variantName?: string
  variantSpecs?: Array<{ name: string; value: number | null; unit?: string }>
  variantPrice?: number
  colorName?: string
  colorHex?: string         // hex of the selected standard colour swatch
  customColorHex?: string   // hex for custom colour selection
  customColorRal?: string   // RAL code if selected from RAL system
  textureName?: string
  textureImageUrl?: string  // image URL of the selected standard texture
  customTextureImageUrl?: string  // blob/object URL for custom texture preview
  finishName?: string
  dimensionId?: string
  colorId?: string
  textureId?: string
  finishId?: string
  customDimensions?: CustomDimension[]  // dynamic dimension tags for custom size
  holesOption?: 'with_holes' | 'without_holes'
  isCustom: boolean
  quantity: number
  unitPrice?: number
  notes?: string
}

const KEY = 'forestry_basket'

function load(): BasketItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(items: BasketItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
}

// Module-level listeners so all hook instances stay in sync
const listeners = new Set<() => void>()
let _items: BasketItem[] = []

function notify() { listeners.forEach(fn => fn()) }

export function useBasket() {
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (_items.length === 0) _items = load()
    const rerender = () => forceRender(n => n + 1)
    listeners.add(rerender)
    return () => { listeners.delete(rerender) }
  }, [])

  const add = useCallback((item: Omit<BasketItem, 'id'>) => {
    const newItem: BasketItem = { ...item, id: Math.random().toString(36).slice(2) }
    _items = [..._items, newItem]
    save(_items)
    notify()
  }, [])

  const remove = useCallback((id: string) => {
    _items = _items.filter(i => i.id !== id)
    save(_items)
    notify()
  }, [])

  const updateQty = useCallback((id: string, quantity: number) => {
    _items = _items.map(i => i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)
    save(_items)
    notify()
  }, [])

  const clear = useCallback(() => {
    _items = []
    save(_items)
    notify()
  }, [])

  return { items: _items, count: _items.reduce((s, i) => s + i.quantity, 0), add, remove, updateQty, clear }
}
