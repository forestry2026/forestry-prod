'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, Ruler, Package, ChevronDown } from 'lucide-react'

interface DimensionSpec {
  id: string
  name: string
  value: number | null
  unit: string
}

interface SpecificationGroup {
  id: string
  name: string
  specifications: DimensionSpec[]
  price: number | null
}

interface DimensionSpecificationsProps {
  specifications: SpecificationGroup[]
  onSpecificationsChange: (specs: SpecificationGroup[]) => void
}

const PRESET_DIMENSIONS = [
  { label: 'Top Diameter', value: 'topDia', icon: '⌀' },
  { label: 'Bottom Diameter', value: 'bottomDia', icon: '⌀' },
  { label: 'Height', value: 'height', icon: '↕' },
  { label: 'Width', value: 'width', icon: '↔' },
  { label: 'Length', value: 'length', icon: '→' },
  { label: 'Depth', value: 'depth', icon: '↶' },
  { label: 'Circumference', value: 'circumference', icon: '◯' },
  { label: 'Wall Thickness', value: 'wallThickness', icon: '⬚' },
]

const UNITS = ['cm', 'mm', 'm', 'inches', 'feet']

export function DimensionSpecifications({
  specifications,
  onSpecificationsChange,
}: DimensionSpecificationsProps) {
  const [localGroups, setLocalGroups] = useState<SpecificationGroup[]>(
    (specifications || []).map(group => ({
      ...group,
      specifications: group.specifications || [],
    }))
  )
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [showPresets, setShowPresets] = useState<string | null>(null)
  const [selectedUnit, setSelectedUnit] = useState('cm')
  const [showCustomModal, setShowCustomModal] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState('')

  const addGroup = () => {
    const newGroupId = `group-${Date.now()}`
    const newGroup: SpecificationGroup = {
      id: newGroupId,
      name: `Variant ${localGroups.length + 1}`,
      specifications: [],
      price: null,
    }
    const updated = [...localGroups, newGroup]
    setLocalGroups(updated)
    onSpecificationsChange(updated)
    setExpandedGroupId(newGroupId)
  }

  const removeGroup = (groupId: string) => {
    const updated = localGroups.filter(g => g.id !== groupId)
    setLocalGroups(updated)
    onSpecificationsChange(updated)
  }

  const updateGroupName = (groupId: string, name: string) => {
    const updated = localGroups.map(g =>
      g.id === groupId ? { ...g, name } : g
    )
    setLocalGroups(updated)
    onSpecificationsChange(updated)
  }

  const updateGroupPrice = (groupId: string, price: number | null) => {
    const updated = localGroups.map(g =>
      g.id === groupId ? { ...g, price } : g
    )
    setLocalGroups(updated)
    onSpecificationsChange(updated)
  }

  const addSpecificationToGroup = (groupId: string, dimValue: string, label: string) => {
    const newSpec: DimensionSpec = {
      id: dimValue,
      name: label,
      value: null,
      unit: selectedUnit,
    }
    const updated = localGroups.map(g =>
      g.id === groupId
        ? { ...g, specifications: [...g.specifications, newSpec] }
        : g
    )
    setLocalGroups(updated)
    onSpecificationsChange(updated)
    setShowPresets(null)
  }

  const updateSpecInGroup = (groupId: string, specId: string, field: keyof DimensionSpec, value: any) => {
    const updated = localGroups.map(g =>
      g.id === groupId
        ? {
            ...g,
            specifications: g.specifications.map(spec =>
              spec.id === specId ? { ...spec, [field]: value } : spec
            ),
          }
        : g
    )
    setLocalGroups(updated)
    onSpecificationsChange(updated)
  }

  const removeSpecFromGroup = (groupId: string, specId: string) => {
    const updated = localGroups.map(g =>
      g.id === groupId
        ? { ...g, specifications: g.specifications.filter(spec => spec.id !== specId) }
        : g
    )
    setLocalGroups(updated)
    onSpecificationsChange(updated)
  }

  const getAvailablePresets = (groupId: string) => {
    const group = localGroups.find(g => g.id === groupId)
    return PRESET_DIMENSIONS.filter(
      preset => !(group?.specifications || []).some(spec => spec.id === preset.value)
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal mb-1">
            Product Specification Groups & Pricing
          </h3>
          <p className="text-xs text-charcoal/60">
            Create specification variants with combined pricing. Each group = one product variant with multiple dimensions
          </p>
        </div>
      </div>

      {/* Specification Groups */}
      {localGroups.length > 0 && (
        <div className="space-y-3">
          {localGroups.map((group) => (
            <div
              key={group.id}
              className="border border-cream-darker rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Group Header - Clickable to Expand */}
              <button
                type="button"
                onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                className="w-full bg-gradient-to-r from-cream/40 to-cream/20 hover:from-cream/60 hover:to-cream/40 transition px-4 py-3 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="w-8 h-8 bg-terracotta/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-terracotta" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroupName(group.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-charcoal bg-transparent border-none outline-none text-sm w-full"
                      placeholder="Group name (e.g., Small, Medium, Large)"
                    />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-terracotta">
                      {group.price ? `AED ${group.price.toFixed(2)}` : 'Price not set'}
                    </p>
                    <p className="text-xs text-charcoal/60">
                      {(group.specifications || []).length} {(group.specifications || []).length === 1 ? 'spec' : 'specs'}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-charcoal/60 transition-transform flex-shrink-0 ml-2 ${
                    expandedGroupId === group.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Group Content - Expandable */}
              {expandedGroupId === group.id && (
                <div className="bg-white border-t border-cream-darker p-4 space-y-4">
                  {/* Group Specifications */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wide">
                      Specifications in this group
                    </label>

                    {(group.specifications || []).length > 0 ? (
                      <div className="space-y-2">
                        {(group.specifications || []).map((spec) => (
                          <div
                            key={spec.id}
                            className="flex items-end gap-2 p-3 bg-cream/20 rounded-lg border border-cream-darker"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              {/* Spec Value */}
                              <div className="flex flex-col">
                                <label className="text-xs text-charcoal/60 font-medium mb-1">
                                  {spec.name}
                                </label>
                                <input
                                  type="number"
                                  value={spec.value ?? ''}
                                  onChange={(e) =>
                                    updateSpecInGroup(
                                      group.id,
                                      spec.id,
                                      'value',
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  placeholder="0.00"
                                  step="0.01"
                                  className="form-input px-2 py-2 bg-white border border-cream-darker rounded text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent transition"
                                />
                              </div>

                              {/* Unit */}
                              <div className="flex flex-col">
                                <label className="text-xs text-charcoal/60 font-medium mb-1">Unit</label>
                                <UnitDropdown
                                  value={spec.unit}
                                  onChange={(u) => updateSpecInGroup(group.id, spec.id, 'unit', u)}
                                />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeSpecFromGroup(group.id, spec.id)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition flex-shrink-0"
                              title="Remove specification"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-charcoal/60 text-sm bg-cream/10 rounded-lg border border-dashed border-cream-darker">
                        No specifications in this group yet
                      </div>
                    )}
                  </div>

                  {/* Add Specification to Group */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowPresets(showPresets === group.id ? null : group.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-terracotta/10 hover:bg-terracotta/20 text-terracotta font-semibold text-sm rounded-lg border border-terracotta/30 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Specification to Group
                    </button>

                    {/* Preset Dropdown */}
                    {showPresets === group.id && (
                      <>
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-cream-darker rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                          {getAvailablePresets(group.id).length === 0 ? (
                            <div className="p-3 text-center text-charcoal/60 text-sm">
                              All preset specifications added
                            </div>
                          ) : (
                            getAvailablePresets(group.id).map(preset => (
                              <button
                                key={preset.value}
                                type="button"
                                onClick={() => {
                                  addSpecificationToGroup(group.id, preset.value, preset.label)
                                  setShowPresets(null)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-cream/50 transition text-sm text-charcoal font-medium border-b border-cream-darker last:border-b-0"
                              >
                                <span className="mr-2">{preset.icon}</span>
                                {preset.label}
                              </button>
                            ))
                          )}
                        </div>

                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowPresets(null)}
                        />
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-cream-darker" />

                  {/* Group Price */}
                  <div className="flex flex-col">
                    <label className="text-xs font-semibold text-charcoal/70 uppercase tracking-wide mb-2">
                      Price for this variant
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 py-2 bg-cream/20 text-charcoal font-semibold text-sm rounded-lg">
                        AED
                      </span>
                      <input
                        type="number"
                        value={group.price ?? ''}
                        onChange={(e) =>
                          updateGroupPrice(
                            group.id,
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="0.00"
                        step="0.01"
                        className="form-input flex-1 px-3 py-2 bg-white border border-cream-darker rounded-lg text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Remove Group Button */}
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Remove Variant Group
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {localGroups.length === 0 && (
        <div className="text-center py-12 px-4 bg-gradient-to-br from-cream/20 to-sage/10 border border-dashed border-cream-darker rounded-lg">
          <Package className="w-10 h-10 text-charcoal/40 mx-auto mb-3" />
          <p className="text-sm text-charcoal/60 font-medium">No specification variants yet</p>
          <p className="text-xs text-charcoal/40 mt-1">Create groups to define product variants with different dimensions and prices</p>
        </div>
      )}

      {/* Divider */}
      {localGroups.length > 0 && <div className="border-t border-cream-darker" />}

      {/* Add Group Section */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-charcoal/70 mb-2">
            Default Unit for New Specifications
          </label>
          <div className="flex gap-2 flex-wrap">
            {UNITS.map(unit => (
              <button
                key={unit}
                type="button"
                onClick={() => setSelectedUnit(unit)}
                className={`px-3 h-9 rounded-xl text-sm font-medium transition ${
                  selectedUnit === unit
                    ? 'bg-terracotta text-white'
                    : 'bg-cream/50 text-charcoal hover:bg-cream'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={addGroup}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta hover:bg-terracotta-dark text-white font-semibold rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add New Variant Group
        </button>
      </div>
    </div>
  )
}

/* ─── Custom unit dropdown ─────────────────────────────────────────────── */
function UnitDropdown({ value, onChange }: { value: string; onChange: (u: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-[38px] flex items-center justify-between gap-1.5 px-2.5 bg-white border border-cream-darker rounded-lg text-sm font-semibold text-charcoal hover:border-terracotta/50 transition focus:outline-none focus:ring-2 focus:ring-terracotta/30"
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-charcoal/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-full bg-white border border-cream-darker rounded-xl shadow-lg overflow-hidden">
          {UNITS.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => { onChange(u); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                u === value
                  ? 'bg-terracotta/10 text-terracotta font-semibold'
                  : 'text-charcoal hover:bg-cream/60'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
