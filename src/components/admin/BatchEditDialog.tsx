'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BatchEditDialogProps {
  selectedProductIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface BatchFormData {
  category: string | null;
  basePrice: number | null;
  isActive: boolean | null;
  isFeatured: boolean | null;
  colorIds: { value: string; mode: 'add' | 'replace' }[];
  textureIds: { value: string; mode: 'add' | 'replace' }[];
  finishIds: { value: string; mode: 'add' | 'replace' }[];
  dimensionIds: { value: string; mode: 'add' | 'replace' }[];
  categoryIds: { value: string; mode: 'add' | 'replace' }[];
}

interface AttributeOptions {
  colors: { id: string; name: string; hexCode: string }[];
  textures: { id: string; name: string }[];
  finishes: { id: string; name: string }[];
  dimensions: { id: string; name: string }[];
  categoryOptions: { id: string; name: string }[];
  categories: string[];
}

export function BatchEditDialog({
  selectedProductIds,
  onSuccess,
  onCancel,
}: BatchEditDialogProps) {
  const [formData, setFormData] = useState<BatchFormData>({
    category: null,
    basePrice: null,
    isActive: null,
    isFeatured: null,
    colorIds: [],
    textureIds: [],
    finishIds: [],
    dimensionIds: [],
    categoryIds: [],
  });

  const [options, setOptions] = useState<AttributeOptions>({
    colors: [],
    textures: [],
    finishes: [],
    dimensions: [],
    categoryOptions: [],
    categories: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [colorsRes, texturesRes, finishesRes, dimensionsRes, categoriesRes, productsRes] =
        await Promise.all([
          fetch('/api/attributes/colors'),
          fetch('/api/attributes/textures'),
          fetch('/api/attributes/finishes'),
          fetch('/api/attributes/dimensions'),
          fetch('/api/attributes/categories'),
          fetch('/api/products'),
        ]);

      const colorsData = await colorsRes.json();
      const texturesData = await texturesRes.json();
      const finishesData = await finishesRes.json();
      const dimensionsData = await dimensionsRes.json();
      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();

      const categories = Array.from(
        new Set(
          (Array.isArray(productsData) ? productsData : productsData?.data || [])
            .map((p: any) => p.category)
            .filter(Boolean)
        )
      ) as string[];

      setOptions({
        colors: Array.isArray(colorsData) ? colorsData : colorsData?.data || [],
        textures: Array.isArray(texturesData) ? texturesData : texturesData?.data || [],
        finishes: Array.isArray(finishesData) ? finishesData : finishesData?.data || [],
        dimensions: Array.isArray(dimensionsData) ? dimensionsData : dimensionsData?.data || [],
        categoryOptions: Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || [],
        categories,
      });
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Build the update payload
      const updatePayload: any = {};

      if (formData.category !== null) {
        updatePayload.category = formData.category;
      }

      if (formData.basePrice !== null) {
        updatePayload.basePrice = formData.basePrice;
      }

      if (formData.isActive !== null) {
        updatePayload.isActive = formData.isActive;
      }

      if (formData.isFeatured !== null) {
        updatePayload.isFeatured = formData.isFeatured;
      }

      // Handle attributes - need to fetch current product data to merge
      const updatePromises = selectedProductIds.map(async (productId) => {
        const payload = { ...updatePayload };

        // For attributes, we need to handle replace vs add
        if (formData.colorIds.length > 0) {
          const colorPayload = formData.colorIds.find((c) => c.mode === 'replace');
          if (colorPayload) {
            // Replace mode: get only the selected colors
            payload.colorIds = formData.colorIds
              .filter((c) => c.mode === 'replace')
              .map((c) => c.value);
          } else {
            // Add mode: fetch current colors and add new ones
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();
            const currentColorIds = product.colors.map((c: any) => c.colorId);
            payload.colorIds = Array.from(
              new Set([
                ...currentColorIds,
                ...formData.colorIds.map((c) => c.value),
              ])
            );
          }
        }

        if (formData.textureIds.length > 0) {
          const texturePayload = formData.textureIds.find((t) => t.mode === 'replace');
          if (texturePayload) {
            payload.textureIds = formData.textureIds
              .filter((t) => t.mode === 'replace')
              .map((t) => t.value);
          } else {
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();
            const currentTextureIds = product.textures.map((t: any) => t.textureId);
            payload.textureIds = Array.from(
              new Set([
                ...currentTextureIds,
                ...formData.textureIds.map((t) => t.value),
              ])
            );
          }
        }

        if (formData.finishIds.length > 0) {
          const finishPayload = formData.finishIds.find((f) => f.mode === 'replace');
          if (finishPayload) {
            payload.finishIds = formData.finishIds
              .filter((f) => f.mode === 'replace')
              .map((f) => f.value);
          } else {
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();
            const currentFinishIds = product.finishes.map((f: any) => f.finishId);
            payload.finishIds = Array.from(
              new Set([
                ...currentFinishIds,
                ...formData.finishIds.map((f) => f.value),
              ])
            );
          }
        }

        if (formData.dimensionIds.length > 0) {
          const dimensionPayload = formData.dimensionIds.find((d) => d.mode === 'replace');
          if (dimensionPayload) {
            payload.dimensionIds = formData.dimensionIds
              .filter((d) => d.mode === 'replace')
              .map((d) => d.value);
          } else {
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();
            const currentDimensionIds = product.dimensions.map((d: any) => d.dimensionId);
            payload.dimensionIds = Array.from(
              new Set([
                ...currentDimensionIds,
                ...formData.dimensionIds.map((d) => d.value),
              ])
            );
          }
        }

        if (formData.categoryIds.length > 0) {
          const categoryPayload = formData.categoryIds.find((c) => c.mode === 'replace');
          if (categoryPayload) {
            payload.categoryIds = formData.categoryIds
              .filter((c) => c.mode === 'replace')
              .map((c) => c.value);
          } else {
            const res = await fetch(`/api/products/${productId}`);
            const product = await res.json();
            const currentCategoryIds = product.categories.map((c: any) => c.categoryId);
            payload.categoryIds = Array.from(
              new Set([
                ...currentCategoryIds,
                ...formData.categoryIds.map((c) => c.value),
              ])
            );
          }
        }

        const response = await fetch(`/api/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to update product ${productId}`);
        }
      });

      await Promise.all(updatePromises);
      onSuccess();
    } catch (error) {
      console.error('Failed to update products:', error);
      alert('Failed to update some products. Please try again.');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
          <p className="text-charcoal">Loading options...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 border border-cream-darker">
          {/* Header */}
          <div className="sticky top-0 px-6 py-3 flex items-center justify-between bg-white border-b border-cream-darker rounded-t-xl">
            <h2 className="text-lg font-bold text-charcoal">
              Batch Edit ({selectedProductIds.length} products)
            </h2>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-charcoal/60 hover:text-charcoal transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            {/* Category & Price - Side by side for compactness */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal/70 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value || null })
                  }
                  className="form-input"
                >
                  <option value="">No change</option>
                  {options.categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal/70 mb-1.5 uppercase tracking-wide">
                  Base Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="No change"
                  value={formData.basePrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      basePrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="form-input"
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-cream/20 rounded-lg border border-cream-darker">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded transition">
                <input
                  type="checkbox"
                  {...{ indeterminate: formData.isActive === null } as any}
                  checked={formData.isActive === true}
                  onChange={(e) => {
                    if (formData.isActive === null) {
                      setFormData({ ...formData, isActive: true });
                    } else if (formData.isActive === true) {
                      setFormData({ ...formData, isActive: false });
                    } else {
                      setFormData({ ...formData, isActive: null });
                    }
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-charcoal">
                  {formData.isActive === null ? 'Active' : formData.isActive ? '✓ Active' : '○ Inactive'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-white/50 p-2 rounded transition">
                <input
                  type="checkbox"
                  {...{ indeterminate: formData.isFeatured === null } as any}
                  checked={formData.isFeatured === true}
                  onChange={(e) => {
                    if (formData.isFeatured === null) {
                      setFormData({ ...formData, isFeatured: true });
                    } else if (formData.isFeatured === true) {
                      setFormData({ ...formData, isFeatured: false });
                    } else {
                      setFormData({ ...formData, isFeatured: null });
                    }
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-charcoal">
                  {formData.isFeatured === null ? 'Featured' : formData.isFeatured ? '★ Featured' : '○ Not Featured'}
                </span>
              </label>
            </div>

            {/* Colors */}
            {options.colors.length > 0 && (
              <BatchAttributeSelector
                label="Colors"
                items={options.colors}
                selectedItems={formData.colorIds}
                onItemsChange={(items) =>
                  setFormData({ ...formData, colorIds: items })
                }
                renderItem={(item) => (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: (item as any).hexCode,
                        borderColor: '#ddd',
                      }}
                    />
                    <span>{(item as any).name}</span>
                  </div>
                )}
              />
            )}

            {/* Textures */}
            {options.textures.length > 0 && (
              <BatchAttributeSelector
                label="Textures"
                items={options.textures}
                selectedItems={formData.textureIds}
                onItemsChange={(items) =>
                  setFormData({ ...formData, textureIds: items })
                }
              />
            )}

            {/* Finishes */}
            {options.finishes.length > 0 && (
              <BatchAttributeSelector
                label="Finishes"
                items={options.finishes}
                selectedItems={formData.finishIds}
                onItemsChange={(items) =>
                  setFormData({ ...formData, finishIds: items })
                }
              />
            )}

            {/* Dimensions */}
            {options.dimensions.length > 0 && (
              <BatchAttributeSelector
                label="Dimensions"
                items={options.dimensions}
                selectedItems={formData.dimensionIds}
                onItemsChange={(items) =>
                  setFormData({ ...formData, dimensionIds: items })
                }
              />
            )}

            {/* Categories */}
            {options.categoryOptions.length > 0 && (
              <BatchAttributeSelector
                label="Categories"
                items={options.categoryOptions}
                selectedItems={formData.categoryIds}
                onItemsChange={(items) =>
                  setFormData({ ...formData, categoryIds: items })
                }
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 flex gap-3 justify-end sticky bottom-0 bg-white border-t border-cream-darker">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-cream-darker text-charcoal text-sm font-semibold hover:bg-cream/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface BatchAttributeSelectorProps {
  label: string;
  items: any[];
  selectedItems: { value: string; mode: 'add' | 'replace' }[];
  onItemsChange: (items: { value: string; mode: 'add' | 'replace' }[]) => void;
  renderItem?: (item: any) => React.ReactNode;
}

function BatchAttributeSelector({
  label,
  items,
  selectedItems,
  onItemsChange,
  renderItem,
}: BatchAttributeSelectorProps) {
  const [mode, setMode] = useState<'add' | 'replace'>('add');

  const handleItemToggle = (itemId: string) => {
    const isSelected = selectedItems.some((i) => i.value === itemId);
    if (isSelected) {
      onItemsChange(selectedItems.filter((i) => i.value !== itemId));
    } else {
      onItemsChange([...selectedItems, { value: itemId, mode }]);
    }
  };

  const handleModeChange = (newMode: 'add' | 'replace') => {
    setMode(newMode);
    // Update mode for all selected items
    onItemsChange(selectedItems.map((i) => ({ ...i, mode: newMode })));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-charcoal">{label}</label>
        <div className="flex gap-1">
          <button
            onClick={() => handleModeChange('add')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              mode === 'add'
                ? 'bg-terracotta text-white'
                : 'bg-cream text-charcoal hover:bg-cream-dark'
            }`}
          >
            + Add
          </button>
          <button
            onClick={() => handleModeChange('replace')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              mode === 'replace'
                ? 'bg-terracotta text-white'
                : 'bg-cream text-charcoal hover:bg-cream-dark'
            }`}
          >
            ⟳ Replace
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {items.map((item) => {
          const isSelected = selectedItems.some((i) => i.value === item.id);
          return (
            <label
              key={item.id}
              className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors text-sm ${
                isSelected
                  ? 'border-terracotta bg-terracotta/10'
                  : 'border-cream-darker hover:border-terracotta/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleItemToggle(item.id)}
                className="w-4 h-4 rounded cursor-pointer flex-shrink-0"
              />
              <div className="text-charcoal flex-1 truncate">
                {renderItem ? renderItem(item) : item.name}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
