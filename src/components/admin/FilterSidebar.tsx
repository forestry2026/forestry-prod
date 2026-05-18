'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';

interface SpecificationRange {
  id: string;
  name: string;
  min: number;
  max: number;
  unit: string;
}

interface FilterOptions {
  categories: { id: string; name: string }[];
  colors: { id: string; name: string; hexCode: string }[];
  textures: { id: string; name: string; imageUrl?: string | null }[];
  finishes: { id: string; name: string }[];
  dimensions: { id: string; name: string }[];
}

interface Filters {
  categoryIds: string[];
  colorIds: string[];
  textureIds: string[];
  finishIds: string[];
  dimensionIds: string[];
  isActive: boolean | null;
  isFeatured: boolean | null;
  specificationRanges: {
    [specId: string]: {
      min: number;
      max: number;
    };
  };
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: Filters) => void;
  filters: Filters;
  products?: any[];
  categories?: { id: string; name: string }[];
}

export function FilterSidebar({
  isOpen,
  onClose,
  onFiltersChange,
  filters,
  products = [],
  categories = [],
}: FilterSidebarProps) {
  const [options, setOptions] = useState<FilterOptions>({
    categories: [],
    colors: [],
    textures: [],
    finishes: [],
    dimensions: [],
  });

  const [specificationRanges, setSpecificationRanges] = useState<SpecificationRange[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['status', 'categories', 'colors', 'textures', 'finishes', 'dimensions', 'specifications']));
  const [isLoading, setIsLoading] = useState(true);

  // Search state for each filter section
  const [categorySearch, setCategorySearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [textureSearch, setTextureSearch] = useState('');
  const [finishSearch, setFinishSearch] = useState('');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Keep categories in sync whenever the prop changes (server may update it)
  useEffect(() => {
    setOptions(prev => ({ ...prev, categories }));
    if (categories.length > 0) setIsLoading(false);
  }, [categories]);

  useEffect(() => {
    if (products && products.length > 0) {
      extractAndSetSpecificationRanges(products);
    }
  }, [products]);

  const extractAndSetSpecificationRanges = (productList: any[]) => {
    const rangesMap = new Map<string, {name: string, min: number, max: number, unit: string}>();

    const processSpec = (spec: any) => {
      if (spec.value !== null && spec.value !== undefined && typeof spec.value === 'number') {
        if (!rangesMap.has(spec.id)) {
          rangesMap.set(spec.id, {
            name: spec.name,
            min: spec.value,
            max: spec.value,
            unit: spec.unit || '',
          });
        } else {
          const existing = rangesMap.get(spec.id)!;
          existing.min = Math.min(existing.min, spec.value);
          existing.max = Math.max(existing.max, spec.value);
        }
      }
    };

    productList.forEach((product) => {
      try {
        const parsed = product.specifications ? JSON.parse(product.specifications) : [];
        // Support both flat specs [{id,name,value,unit}] and group format [{name, specifications:[...]}]
        parsed.forEach((item: any) => {
          if (Array.isArray(item.specifications)) {
            // Group format — iterate nested specs
            item.specifications.forEach(processSpec);
          } else {
            // Flat format
            processSpec(item);
          }
        });
      } catch (e) {
        // Skip products with invalid specifications
      }
    });

    const specRanges = Array.from(rangesMap.entries())
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setSpecificationRanges(specRanges);
  };

  const fetchFilterOptions = async () => {
    try {
      const [colorsRes, texturesRes, finishesRes, dimensionsRes] =
        await Promise.all([
          fetch('/api/attributes/colors'),
          fetch('/api/attributes/textures'),
          fetch('/api/attributes/finishes'),
          fetch('/api/attributes/dimensions'),
        ]);

      const colorsData = await colorsRes.json();
      const texturesData = await texturesRes.json();
      const finishesData = await finishesRes.json();
      const dimensionsData = await dimensionsRes.json();

      setOptions({
        categories, // from server — already live & typed as {id, name}[]
        colors: Array.isArray(colorsData) ? colorsData : colorsData?.data || [],
        textures: Array.isArray(texturesData) ? texturesData : texturesData?.data || [],
        finishes: Array.isArray(finishesData) ? finishesData : finishesData?.data || [],
        dimensions: Array.isArray(dimensionsData) ? dimensionsData : dimensionsData?.data || [],
      });
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  const handleStatusChange = (status: 'active' | 'featured') => {
    const newFilters = { ...filters };
    if (status === 'active') {
      newFilters.isActive =
        newFilters.isActive === null ? true : newFilters.isActive === true ? false : null;
    } else {
      newFilters.isFeatured =
        newFilters.isFeatured === null ? true : newFilters.isFeatured === true ? false : null;
    }
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters };
    newFilters.categoryIds = newFilters.categoryIds.includes(categoryId)
      ? newFilters.categoryIds.filter((id) => id !== categoryId)
      : [...newFilters.categoryIds, categoryId];
    onFiltersChange(newFilters);
  };

  const handleColorChange = (colorId: string) => {
    const newFilters = { ...filters };
    newFilters.colorIds = newFilters.colorIds.includes(colorId)
      ? newFilters.colorIds.filter((id) => id !== colorId)
      : [...newFilters.colorIds, colorId];
    onFiltersChange(newFilters);
  };

  const handleTextureChange = (textureId: string) => {
    const newFilters = { ...filters };
    newFilters.textureIds = newFilters.textureIds.includes(textureId)
      ? newFilters.textureIds.filter((id) => id !== textureId)
      : [...newFilters.textureIds, textureId];
    onFiltersChange(newFilters);
  };

  const handleFinishChange = (finishId: string) => {
    const newFilters = { ...filters };
    newFilters.finishIds = newFilters.finishIds.includes(finishId)
      ? newFilters.finishIds.filter((id) => id !== finishId)
      : [...newFilters.finishIds, finishId];
    onFiltersChange(newFilters);
  };

  const handleDimensionChange = (dimensionId: string) => {
    const newFilters = { ...filters };
    newFilters.dimensionIds = newFilters.dimensionIds.includes(dimensionId)
      ? newFilters.dimensionIds.filter((id) => id !== dimensionId)
      : [...newFilters.dimensionIds, dimensionId];
    onFiltersChange(newFilters);
  };

  const handleSpecificationRangeChange = (specId: string, min: number, max: number) => {
    const newFilters = { ...filters };
    newFilters.specificationRanges = {
      ...newFilters.specificationRanges,
      [specId]: { min, max },
    };
    onFiltersChange(newFilters);
  };

  const handleClearSpecificationRange = (specId: string) => {
    const newFilters = { ...filters };
    const newRanges = { ...newFilters.specificationRanges };
    delete newRanges[specId];
    newFilters.specificationRanges = newRanges;
    onFiltersChange(newFilters);
  };

  const handleResetAllFilters = () => {
    onFiltersChange({
      categoryIds: [],
      colorIds: [],
      textureIds: [],
      finishIds: [],
      dimensionIds: [],
      isActive: null,
      isFeatured: null,
      specificationRanges: {},
    });
  };

  const getActiveFilterCount = () => {
    return (
      filters.categoryIds.length +
      filters.colorIds.length +
      filters.textureIds.length +
      filters.finishIds.length +
      filters.dimensionIds.length +
      (filters.isActive !== null ? 1 : 0) +
      (filters.isFeatured !== null ? 1 : 0) +
      Object.keys(filters.specificationRanges).length
    );
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 inset-y-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderLeft: '0.5px solid #e8dcc4' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: '#e8dcc4' }}>
          <h2 className="text-lg font-bold text-charcoal">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 text-charcoal/60 hover:text-charcoal hover:bg-cream/30 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
          {/* Status Section */}
          <FilterSection
            label="Status"
            expanded={expandedSections.has('status')}
            onToggle={() => toggleSection('status')}
            count={(filters.isActive !== null ? 1 : 0) + (filters.isFeatured !== null ? 1 : 0)}
          >
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isActive === true}
                  onChange={() => handleStatusChange('active')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-charcoal">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isFeatured === true}
                  onChange={() => handleStatusChange('featured')}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-charcoal">Featured</span>
              </label>
            </div>
          </FilterSection>

          {/* Categories Section */}
          {options.categories.length > 0 && (
            <FilterSection
              label="Categories"
              expanded={expandedSections.has('categories')}
              onToggle={() => toggleSection('categories')}
              count={filters.categoryIds.length}
            >
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-cream-darker rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {options.categories
                    .filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.categoryIds.includes(cat.id)}
                          onChange={() => handleCategoryChange(cat.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-charcoal">{cat.name}</span>
                      </label>
                    ))}
                  {options.categories.filter((cat) => cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-charcoal/50 py-2">No categories found</p>
                  )}
                </div>
              </div>
            </FilterSection>
          )}

          {/* Colors Section */}
          {options.colors.length > 0 && (
            <FilterSection
              label="Colors"
              expanded={expandedSections.has('colors')}
              onToggle={() => toggleSection('colors')}
              count={filters.colorIds.length}
            >
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search colors..."
                    value={colorSearch}
                    onChange={(e) => setColorSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-cream-darker rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {options.colors
                    .filter((color) => color.name.toLowerCase().includes(colorSearch.toLowerCase()))
                    .map((color) => (
                      <label key={color.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.colorIds.includes(color.id)}
                          onChange={() => handleColorChange(color.id)}
                          className="w-4 h-4 rounded"
                        />
                        <div
                          className="w-4 h-4 rounded border flex-shrink-0"
                          style={{ backgroundColor: color.hexCode, borderColor: '#ddd' }}
                        />
                        <span className="text-sm text-charcoal">{color.name}</span>
                      </label>
                    ))}
                  {options.colors.filter((color) => color.name.toLowerCase().includes(colorSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-charcoal/50 py-2">No colors found</p>
                  )}
                </div>
              </div>
            </FilterSection>
          )}

          {/* Textures Section */}
          {options.textures.length > 0 && (
            <FilterSection
              label="Textures"
              expanded={expandedSections.has('textures')}
              onToggle={() => toggleSection('textures')}
              count={filters.textureIds.length}
            >
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search textures..."
                    value={textureSearch}
                    onChange={(e) => setTextureSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-cream-darker rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {options.textures
                    .filter((texture) => texture.name.toLowerCase().includes(textureSearch.toLowerCase()))
                    .map((texture) => (
                      <label key={texture.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.textureIds.includes(texture.id)}
                          onChange={() => handleTextureChange(texture.id)}
                          className="w-4 h-4 rounded"
                        />
                        {texture.imageUrl ? (
                          <div
                            className="w-4 h-4 rounded border flex-shrink-0 overflow-hidden"
                            style={{ borderColor: '#ddd' }}
                          >
                            <img
                              src={texture.imageUrl}
                              alt={texture.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-4 h-4 rounded border flex-shrink-0 bg-cream-dark"
                            style={{ borderColor: '#ddd' }}
                          />
                        )}
                        <span className="text-sm text-charcoal">{texture.name}</span>
                      </label>
                    ))}
                  {options.textures.filter((texture) => texture.name.toLowerCase().includes(textureSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-charcoal/50 py-2">No textures found</p>
                  )}
                </div>
              </div>
            </FilterSection>
          )}

          {/* Finishes Section */}
          {options.finishes.length > 0 && (
            <FilterSection
              label="Finishes"
              expanded={expandedSections.has('finishes')}
              onToggle={() => toggleSection('finishes')}
              count={filters.finishIds.length}
            >
              <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search finishes..."
                    value={finishSearch}
                    onChange={(e) => setFinishSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-cream-darker rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-2">
                  {options.finishes
                    .filter((finish) => finish.name.toLowerCase().includes(finishSearch.toLowerCase()))
                    .map((finish) => (
                      <label key={finish.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.finishIds.includes(finish.id)}
                          onChange={() => handleFinishChange(finish.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-charcoal">{finish.name}</span>
                      </label>
                    ))}
                  {options.finishes.filter((finish) => finish.name.toLowerCase().includes(finishSearch.toLowerCase())).length === 0 && (
                    <p className="text-sm text-charcoal/50 py-2">No finishes found</p>
                  )}
                </div>
              </div>
            </FilterSection>
          )}

          {/* Dimensions & Specifications Section */}
          {specificationRanges.length > 0 && (
            <FilterSection
              label="Dimensions & Specifications"
              expanded={expandedSections.has('dimensions')}
              onToggle={() => toggleSection('dimensions')}
              count={Object.keys(filters.specificationRanges).length}
            >
              <div className="space-y-4">
                {specificationRanges.map((spec) => {
                  const filterRange = filters.specificationRanges[spec.id];
                  const minValue = filterRange?.min ?? spec.min;
                  const maxValue = filterRange?.max ?? spec.max;
                  const isFiltered = !!filterRange;
                  const rangeSpan = spec.max - spec.min || 1;
                  const minPct = ((minValue - spec.min) / rangeSpan) * 100;
                  const maxPct = ((maxValue - spec.min) / rangeSpan) * 100;

                  return (
                    <div key={spec.id} className="space-y-2">
                      {/* Label row */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-charcoal">
                          {spec.name}{spec.unit ? <span className="font-normal text-charcoal/50 ml-1">({spec.unit})</span> : null}
                        </span>
                        {isFiltered && (
                          <button
                            onClick={() => handleClearSpecificationRange(spec.id)}
                            className="text-[11px] text-terracotta hover:text-terracotta/70 font-semibold transition"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {/* Min slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-charcoal/50">
                          <span>Min</span>
                          <span className="font-semibold text-charcoal">{Math.round(minValue * 10) / 10}{spec.unit ? ` ${spec.unit}` : ''}</span>
                        </div>
                        <input
                          type="range"
                          min={spec.min}
                          max={spec.max}
                          step={(rangeSpan / 100) || 0.1}
                          value={minValue}
                          onChange={(e) => {
                            const newMin = parseFloat(e.target.value);
                            if (newMin <= maxValue) handleSpecificationRangeChange(spec.id, newMin, maxValue);
                          }}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #e8dcc4 0%, #e8dcc4 ${minPct}%, #C96B4A ${minPct}%, #C96B4A 100%)`
                          }}
                        />
                      </div>

                      {/* Max slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-charcoal/50">
                          <span>Max</span>
                          <span className="font-semibold text-charcoal">{Math.round(maxValue * 10) / 10}{spec.unit ? ` ${spec.unit}` : ''}</span>
                        </div>
                        <input
                          type="range"
                          min={spec.min}
                          max={spec.max}
                          step={(rangeSpan / 100) || 0.1}
                          value={maxValue}
                          onChange={(e) => {
                            const newMax = parseFloat(e.target.value);
                            if (newMax >= minValue) handleSpecificationRangeChange(spec.id, minValue, newMax);
                          }}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #C96B4A 0%, #C96B4A ${maxPct}%, #e8dcc4 ${maxPct}%, #e8dcc4 100%)`
                          }}
                        />
                      </div>

                      {/* Range pill */}
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs" style={{ backgroundColor: isFiltered ? '#fdf2ee' : '#f7f3ed', border: `0.5px solid ${isFiltered ? '#C96B4A40' : '#e8dcc4'}` }}>
                        <span className={isFiltered ? 'text-terracotta font-semibold' : 'text-charcoal/50'}>
                          {Math.round(minValue * 10) / 10} – {Math.round(maxValue * 10) / 10}{spec.unit ? ` ${spec.unit}` : ''}
                        </span>
                        <span className="text-charcoal/30 text-[10px]">
                          of {spec.min}–{spec.max}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </FilterSection>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-6 py-4 bg-white border-t space-y-3"
          style={{ borderColor: '#e8dcc4' }}
        >
          <button
            onClick={handleResetAllFilters}
            className="w-full px-4 py-2 border border-cream-darker text-charcoal rounded-lg hover:bg-cream/50 transition font-semibold text-sm"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-terracotta text-white rounded-lg hover:bg-terracotta/90 transition font-semibold text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}

interface FilterSectionProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}

function FilterSection({
  label,
  expanded,
  onToggle,
  count,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b" style={{ borderColor: '#e8dcc4' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 py-3 hover:bg-cream/20 transition px-0"
      >
        <span className="font-semibold text-charcoal text-sm">{label}</span>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="bg-terracotta text-white text-xs font-bold px-2 py-0.5 rounded">
              {count}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-charcoal/60 transition-transform flex-shrink-0 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}
