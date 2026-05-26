'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit2, Trash2, Plus, AlertCircle, Search, X, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface FormData {
  name: string;
  isActive: boolean;
  sortOrder: number;
}

interface DeleteConfirmation {
  open: boolean;
  categoryId: string;
  categoryName: string;
  productCount: number;
  isDeleting: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    open: false,
    categoryId: '',
    categoryName: '',
    productCount: 0,
    isDeleting: false,
  });

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return categories.filter((category) =>
      category.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [categories, searchTerm]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-dismiss success message after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/attributes/categories');
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const url = editingId
        ? `/api/attributes/categories/${editingId}`
        : '/api/attributes/categories';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save category');
        return;
      }

      setSuccess(editingId ? 'Category updated successfully' : 'Category created successfully');
      setFormData({ name: '', isActive: true, sortOrder: 0 });
      setIsAdding(false);
      setEditingId(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsAdding(true);
    setError('');
    setSuccess('');
  };

  const handleDeleteClick = async (id: string, name: string) => {
    try {
      // Check how many products use this category
      const productsResponse = await fetch('/api/products');
      const productsData = await productsResponse.json();
      const products = productsData.data || productsData || [];

      const productCount = products.filter((product: any) =>
        product.categories?.some((cat: any) => cat.categoryId === id)
      ).length;

      setDeleteConfirmation({
        open: true,
        categoryId: id,
        categoryName: name,
        productCount,
        isDeleting: false,
      });
    } catch (error) {
      console.error('Error checking products:', error);
      setError('Failed to check if category is in use');
    }
  };

  const handleDelete = async () => {
    const { categoryId, categoryName } = deleteConfirmation;

    try {
      setDeleteConfirmation((prev) => ({ ...prev, isDeleting: true }));

      const response = await fetch(`/api/attributes/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Surface the server's human-readable error message instead of a
        // generic string — backend returns reasons like "Cannot delete — N
        // products are still assigned to this category."
        const data = await response.json().catch(() => ({} as { error?: string }));
        setError(data.error ?? `Failed to delete category (HTTP ${response.status}).`);
        setDeleteConfirmation((prev) => ({ ...prev, isDeleting: false }));
        return;
      }

      setSuccess(`Category "${categoryName}" deleted successfully`);
      setDeleteConfirmation({ open: false, categoryId: '', categoryName: '', productCount: 0, isDeleting: false });
      await fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete category');
      setDeleteConfirmation((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ open: false, categoryId: '', categoryName: '', productCount: 0, isDeleting: false });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', isActive: true, sortOrder: 0 });
    setError('');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-charcoal/60">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/attributes" className="mt-2 p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Attributes</p>
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Categories</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">Product classification tree</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{categories.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Categories</span>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-semibold">
          {success}
        </div>
      )}

      {/* ── Add/Edit form ── */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6">
          <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-5">
            {editingId ? 'Edit Category' : 'New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Furniture"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded accent-terracotta"
              />
              <span className="text-sm font-semibold text-charcoal-700">Active</span>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by category name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Categories list ── */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Tag className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {searchTerm ? 'No matching categories' : 'No categories yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {searchTerm ? `No results for "${searchTerm}"` : 'Create your first category to organise products.'}
            </p>
            {searchTerm ? (
              <button onClick={() => setSearchTerm('')} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">Clear search</button>
            ) : (
              <button onClick={() => setIsAdding(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create first category
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <ul className="divide-y divide-[#E8E0D5]">
            {filteredCategories.map(cat => (
              <li key={cat.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-cream/40 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.isActive ? 'bg-terracotta/10' : 'bg-charcoal-100'}`}>
                  <Tag className={`w-4 h-4 ${cat.isActive ? 'text-terracotta' : 'text-charcoal-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${cat.isActive ? 'text-charcoal-900' : 'text-charcoal-400'}`}>{cat.name}</p>
                    {!cat.isActive && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-charcoal-100 text-charcoal-400 px-1.5 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-[11px] text-charcoal-300 mt-0.5">Sort order: {cat.sortOrder}</p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream hover:bg-terracotta/10 text-charcoal-400 hover:text-terracotta transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat.id, cat.name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-charcoal-300 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirmation.open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={handleCancelDelete} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900">Delete Category</h2>
                  <p className="text-sm text-charcoal-400 mt-0.5">"{deleteConfirmation.categoryName}"</p>
                </div>
              </div>
              {deleteConfirmation.productCount > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-700 font-medium">
                    This category is used by <strong>{deleteConfirmation.productCount}</strong>{' '}
                    {deleteConfirmation.productCount === 1 ? 'product' : 'products'}. Deleting it will remove it from all of them.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-charcoal-500">Are you sure? This action cannot be undone.</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteConfirmation.isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold hover:bg-cream transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmation.isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteConfirmation.isDeleting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Deleting…</>
                  ) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
