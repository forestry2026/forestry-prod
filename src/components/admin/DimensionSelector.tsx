'use client'

import { useState, useMemo } from 'react'
import { X, Plus, Check, AlertCircle, Search } from 'lucide-react'

interface Dimension {
  id: string
  name: string
}

interface DimensionSelectorProps {
  availableDimensions: Dimension[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export function DimensionSelector({
  availableDimensions,
  selectedIds,
  onSelectionChange,
}: DimensionSelectorProps) {
  const [searchInput, setSearchInput] = useState('')
  const [newDimensionInput, setNewDimensionInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [newDimensions, setNewDimensions] = useState<string[]>([])

  // Filter dimensions based on search
  const filteredDimensions = useMemo(() => {
    return availableDimensions.filter(dim =>
      dim.name.toLowerCase().includes(searchInput.toLowerCase()) &&
      !selectedIds.includes(dim.id)
    )
  }, [searchInput, availableDimensions, selectedIds])

  // Check for duplicates
  const duplicateExists = useMemo(() => {
    const lowerInput = newDimensionInput.toLowerCase().trim()
    return (
      availableDimensions.some(d => d.name.toLowerCase() === lowerInput) ||
      newDimensions.some(d => d.toLowerCase() === lowerInput)
    )
  }, [newDimensionInput, availableDimensions, newDimensions])

  // Get selected dimension objects
  const selectedDimensions = availableDimensions.filter(d =>
    selectedIds.includes(d.id)
  )

  const handleSelectDimension = (id: string) => {
    onSelectionChange([...selectedIds, id])
    setSearchInput('')
    setShowDropdown(false)
  }

  const handleRemoveDimension = (id: string) => {
    onSelectionChange(selectedIds.filter(sid => sid !== id))
  }

  const handleAddNewDimension = () => {
    const trimmed = newDimensionInput.trim()
    if (trimmed && !duplicateExists) {
      setNewDimensions([...newDimensions, trimmed])
      setNewDimensionInput('')
    }
  }

  const handleRemoveNewDimension = (index: number) => {
    setNewDimensions(newDimensions.filter((_, i) => i !== index))
  }

  const isAddButtonDisabled =
    !newDimensionInput.trim() || duplicateExists

  return (
    <div className="space-y-6">
      {/* Selected Dimensions Display */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal mb-3">
          Selected Dimensions ({selectedIds.length + newDimensions.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedDimensions.length === 0 && newDimensions.length === 0 ? (
            <p className="text-sm text-charcoal/60 italic">No dimensions selected</p>
          ) : (
            <>
              {selectedDimensions.map(dim => (
                <div
                  key={dim.id}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-terracotta/10 border border-terracotta rounded-full group hover:bg-terracotta/20 transition"
                >
                  <Check className="w-4 h-4 text-terracotta" />
                  <span className="text-sm font-medium text-charcoal">{dim.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDimension(dim.id)}
                    className="ml-1 p-0.5 hover:bg-terracotta/30 rounded-full transition"
                  >
                    <X className="w-3 h-3 text-terracotta" />
                  </button>
                </div>
              ))}
              {newDimensions.map((dim, index) => (
                <div
                  key={`new-${index}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-sage/10 border border-sage rounded-full group hover:bg-sage/20 transition"
                >
                  <Plus className="w-4 h-4 text-sage" />
                  <span className="text-sm font-medium text-charcoal">{dim}</span>
                  <span className="text-xs text-sage font-semibold ml-1">(NEW)</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewDimension(index)}
                    className="ml-1 p-0.5 hover:bg-sage/30 rounded-full transition"
                  >
                    <X className="w-3 h-3 text-sage" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-cream-darker" />

      {/* Add Dimension Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-charcoal">Add Dimension</h3>

        {/* New Dimension Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-charcoal/70">
            Enter a new dimension
          </label>
          <div className="relative">
            <input
              type="text"
              value={newDimensionInput}
              onChange={(e) => setNewDimensionInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isAddButtonDisabled) {
                  e.preventDefault()
                  handleAddNewDimension()
                }
              }}
              placeholder="e.g., Extra Large, Mini, King Size..."
              className="w-full px-4 py-3 bg-cream/30 border border-cream-darker rounded-lg focus:ring-2 focus:ring-sage focus:border-transparent transition"
            />
            {newDimensionInput && duplicateExists && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
            )}
          </div>

          {/* Duplicate Warning */}
          {newDimensionInput && duplicateExists && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  This dimension already exists
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  We found a similar dimension in your system. Please select it instead or use a different name.
                </p>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddNewDimension}
            disabled={isAddButtonDisabled}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sage hover:bg-sage-dark text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Dimension
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-cream-darker" />

        {/* Search Existing Dimensions */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-charcoal/70">
            Or select from existing dimensions
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="w-4 h-4 text-charcoal/40" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search dimensions..."
              className="w-full pl-10 pr-4 py-3 bg-cream/30 border border-cream-darker rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent transition"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-cream-darker rounded-lg shadow-lg overflow-hidden">
              {filteredDimensions.length === 0 ? (
                <div className="p-4 text-center text-charcoal/60 text-sm">
                  {searchInput ? 'No dimensions found' : 'No more dimensions available'}
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {filteredDimensions.map(dim => (
                    <button
                      key={dim.id}
                      type="button"
                      onClick={() => handleSelectDimension(dim.id)}
                      className="w-full text-left px-4 py-3 hover:bg-cream/50 transition flex items-center gap-3 group"
                    >
                      <div className="w-5 h-5 rounded border border-cream-darker group-hover:border-terracotta transition" />
                      <span className="text-sm font-medium text-charcoal">{dim.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {showDropdown && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setShowDropdown(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
