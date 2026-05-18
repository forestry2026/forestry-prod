'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterOptions {
  categories: string[];
  colors: { id: string; name: string; hexCode: string }[];
  textures: { id: string; name: string; imageUrl?: string | null }[];
  finishes: { id: string; name: string }[];
  dimensions: { id: string; name: string }[];
}

interface SpecificationRange {
  id: string;
  name: string;
  min: number;
  max: number;
  unit: string;
}

interface Filters {
  categories: string[];
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

interface ProductFilterBarProps {
  onFiltersChange: (filters: Filters) => void;
  products?: any[];
}

export function ProductFilterBar({ onFiltersChange, products = [] }: ProductFilterBarProps) {
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    colorIds: [],
    textureIds: [],
    finishIds: [],
    dimensionIds: [],
    isActive: null,
    isFeatured: null,
    specificationRanges: {},
  });

  const [options, setOptions] = useState<FilterOptions>({
    categories: [],
    colors: [],
    textures: [],
    finishes: [],
    dimensions: [],
  });

  const [specificationRanges, setSpecificationRanges] = useState<SpecificationRange[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      extractAndSetSpecificationRanges(products);
    }
  }, [products]);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const extractAndSetSpecificationRanges = (productList: any[]) => {
    const rangesMap = new Map<string, {name: string, min: number, max: number, unit: string}>();

    productList.forEach((product) => {
      try {
        const specs = product.specifications ? JSON.parse(product.specifications) : [];
        specs.forEach((spec: any) => {
          if (spec.value !== null && typeof spec.value === 'number') {
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
      const [categoriesRes, colorsRes, texturesRes, finishesRes, dimensionsRes] =
        await Promise.all([
          fetch('/api/attributes/categories'),
          fetch('/api/attributes/colors'),
          fetch('/api/attributes/textures'),
          fetch('/api/attributes/finishes'),
          fetch('/api/attributes/dimensions'),
        ]);

      const categoriesData = await categoriesRes.json();
      const colorsData = await colorsRes.json();
      const texturesData = await texturesRes.json();
      const finishesData = await finishesRes.json();
      const dimensionsData = await dimensionsRes.json();

      // Extract category names from the categories API response
      const categoryNames = (Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [])
        .filter((c: any) => c.isActive)
        .map((c: any) => c.name)
        .sort();

      setOptions({
        categories: categoryNames,
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

  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleColorChange = (colorId: string) => {
    setFilters((prev) => ({
      ...prev,
      colorIds: prev.colorIds.includes(colorId)
        ? prev.colorIds.filter((id) => id !== colorId)
        : [...prev.colorIds, colorId],
    }));
  };

  const handleTextureChange = (textureId: string) => {
    setFilters((prev) => ({
      ...prev,
      textureIds: prev.textureIds.includes(textureId)
        ? prev.textureIds.filter((id) => id !== textureId)
        : [...prev.textureIds, textureId],
    }));
  };

  const handleFinishChange = (finishId: string) => {
    setFilters((prev) => ({
      ...prev,
      finishIds: prev.finishIds.includes(finishId)
        ? prev.finishIds.filter((id) => id !== finishId)
        : [...prev.finishIds, finishId],
    }));
  };

  const handleDimensionChange = (dimensionId: string) => {
    setFilters((prev) => ({
      ...prev,
      dimensionIds: prev.dimensionIds.includes(dimensionId)
        ? prev.dimensionIds.filter((id) => id !== dimensionId)
        : [...prev.dimensionIds, dimensionId],
    }));
  };

  const handleStatusChange = (status: 'active' | 'featured') => {
    setFilters((prev) => {
      if (status === 'active') {
        return {
          ...prev,
          isActive:
            prev.isActive === null ? true : prev.isActive === true ? false : null,
        };
      } else {
        return {
          ...prev,
          isFeatured:
            prev.isFeatured === null ? true : prev.isFeatured === true ? false : null,
        };
      }
    });
  };

  const handleResetFilters = () => {
    setFilters({
      categories: [],
      colorIds: [],
      textureIds: [],
      finishIds: [],
      dimensionIds: [],
      isActive: null,
      isFeatured: null,
      specificationRanges: {},
    });
  };

  const handleSpecificationRangeChange = (specId: string, min: number, max: number) => {
    setFilters((prev) => ({
      ...prev,
      specificationRanges: {
        ...prev.specificationRanges,
        [specId]: { min, max },
      },
    }));
  };

  const handleClearSpecificationRange = (specId: string) => {
    setFilters((prev) => {
      const newRanges = { ...prev.specificationRanges };
      delete newRanges[specId];
      return {
        ...prev,
        specificationRanges: newRanges,
      };
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-3 space-y-2" style={{ borderWidth: '0.5px', borderColor: '#e8dcc4' }}>
      <div className="flex items-center justify-between">
        {handleResetFilters && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-terracotta hover:text-terracotta/80 font-semibold transition"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Categories */}
        <FilterSection
          label="Category"
          section="categories"
          expanded={expandedSections.has('categories')}
          onToggle={() => toggleSection('categories')}
          count={filters.categories.length}
        >
          {options.categories.length > 0 ? (
            <div className="space-y-1">
              {options.categories.map((category) => (
                <label key={category} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-3 h-3 rounded"
                  />
                  <span className="text-charcoal text-xs">{category}</span>
                </label>
              ))}
            </div>
          ) : null}
        </FilterSection>

        {/* Colors */}
        {options.colors.length > 0 && (
          <FilterSection
            label="Color"
            section="colors"
            expanded={expandedSections.has('colors')}
            onToggle={() => toggleSection('colors')}
            count={filters.colorIds.length}
          >
            <div className="space-y-1">
              {options.colors.map((color) => (
                <label key={color.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.colorIds.includes(color.id)}
                    onChange={() => handleColorChange(color.id)}
                    className="w-3 h-3 rounded"
                  />
                  <div
                    className="w-3 h-3 rounded border flex-shrink-0"
                    style={{ backgroundColor: color.hexCode, borderColor: '#ddd' }}
                  />
                  <span className="text-charcoal text-xs truncate">{color.name}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Textures */}
        {options.textures.length > 0 && (
          <FilterSection
            label="Texture"
            section="textures"
            expanded={expandedSections.has('textures')}
            onToggle={() => toggleSection('textures')}
            count={filters.textureIds.length}
          >
            <div className="space-y-1">
              {options.textures.map((texture) => (
                <label key={texture.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.textureIds.includes(texture.id)}
                    onChange={() => handleTextureChange(texture.id)}
                    className="w-3 h-3 rounded"
                  />
                  {texture.imageUrl ? (
                    <div className="w-4 h-4 rounded border flex-shrink-0 overflow-hidden" style={{ borderColor: '#ddd' }}>
                      <img src={texture.imageUrl} alt={texture.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded border flex-shrink-0 bg-cream-dark" style={{ borderColor: '#ddd' }} />
                  )}
                  <span className="text-charcoal text-xs truncate">{texture.name}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Finishes */}
        {options.finishes.length > 0 && (
          <FilterSection
            label="Finish"
            section="finishes"
            expanded={expandedSections.has('finishes')}
            onToggle={() => toggleSection('finishes')}
            count={filters.finishIds.length}
          >
            <div className="space-y-1">
              {options.finishes.map((finish) => (
                <label key={finish.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.finishIds.includes(finish.id)}
                    onChange={() => handleFinishChange(finish.id)}
                    className="w-3 h-3 rounded"
                  />
                  <span className="text-charcoal text-xs truncate">{finish.name}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Dimensions */}
        {options.dimensions.length > 0 && (
          <FilterSection
            label="Dimension"
            section="dimensions"
            expanded={expandedSections.has('dimensions')}
            onToggle={() => toggleSection('dimensions')}
            count={filters.dimensionIds.length}
          >
            <div className="space-y-1">
              {options.dimensions.map((dimension) => (
                <label key={dimension.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.dimensionIds.includes(dimension.id)}
                    onChange={() => handleDimensionChange(dimension.id)}
                    className="w-3 h-3 rounded"
                  />
                  <span className="text-charcoal text-xs truncate">{dimension.name}</span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Status */}
        <FilterSection
          label="Status"
          section="status"
          expanded={expandedSections.has('status')}
          onToggle={() => toggleSection('status')}
          count={(filters.isActive !== null ? 1 : 0) + (filters.isFeatured !== null ? 1 : 0)}
        >
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isActive === true}
                onChange={() => handleStatusChange('active')}
                className="w-3 h-3 rounded"
              />
              <span className="text-charcoal text-xs">Active</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isFeatured === true}
                onChange={() => handleStatusChange('featured')}
                className="w-3 h-3 rounded"
              />
              <span className="text-charcoal text-xs">Featured</span>
            </label>
          </div>
        </FilterSection>
      </div>

      {/* Specification Ranges */}
      {specificationRanges.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: '#e8dcc4' }}>
          <h3 className="text-xs font-semibold text-charcoal mb-3">Specifications</h3>
          <div className="space-y-4">
            {specificationRanges.map((spec) => {
              const filterRange = filters.specificationRanges[spec.id];
              const minValue = filterRange?.min ?? spec.min;
              const maxValue = filterRange?.max ?? spec.max;
              const isFiltered = !!filterRange;

              return (
                <div key={spec.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-charcoal">
                      {spec.name} {spec.unit && `(${spec.unit})`}
                    </label>
                    {isFiltered && (
                      <button
                        onClick={() => handleClearSpecificationRange(spec.id)}
                        className="text-xs text-terracotta hover:text-terracotta/80 font-semibold transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-charcoal/60 block mb-1">Min</label>
                      <input
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        step="any"
                        value={minValue}
                        onChange={(e) => {
                          const newMin = parseFloat(e.target.value) || spec.min;
                          handleSpecificationRangeChange(spec.id, newMin, maxValue);
                        }}
                        className="w-full px-2 py-1.5 border rounded text-xs border-cream-darker focus:border-terracotta focus:ring-1 focus:ring-terracotta/20 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-charcoal/60 block mb-1">Max</label>
                      <input
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        step="any"
                        value={maxValue}
                        onChange={(e) => {
                          const newMax = parseFloat(e.target.value) || spec.max;
                          handleSpecificationRangeChange(spec.id, minValue, newMax);
                        }}
                        className="w-full px-2 py-1.5 border rounded text-xs border-cream-darker focus:border-terracotta focus:ring-1 focus:ring-terracotta/20 outline-none"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-charcoal/60">
                    Data range: {spec.min} - {spec.max} {spec.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterSectionProps {
  label: string;
  section: string;
  expanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}

function FilterSection({
  label,
  section,
  expanded,
  onToggle,
  count,
  children,
}: FilterSectionProps) {
  return (
    <div
      className="border rounded p-2"
      style={{ borderWidth: '0.5px', borderColor: '#e8dcc4' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-1 hover:bg-cream/30 transition rounded p-1 -m-1"
      >
        <span className="font-semibold text-charcoal text-xs">{label}</span>
        <div className="flex items-center gap-1">
          {count > 0 && (
            <span className="bg-terracotta text-white text-xs font-bold px-1.5 rounded min-w-fit">
              {count}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-charcoal/60 transition-transform flex-shrink-0 ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>
      {expanded && <div className="pt-2 mt-2 border-t" style={{ borderColor: '#e8dcc4' }}>{children}</div>}
    </div>
  );
}
