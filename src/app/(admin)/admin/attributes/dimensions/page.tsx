'use client';

import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Search, X as XIcon, Ruler } from 'lucide-react';
import { useState, useEffect } from 'react';

const SEED_DIMENSIONS = [
  { name: 'Small', label: 'Small', width: 5, height: 5, depth: 5, sortOrder: 1 },
  { name: 'Medium', label: 'Medium', width: 8, height: 8, depth: 8, sortOrder: 2 },
  { name: 'Large', label: 'Large', width: 12, height: 12, depth: 12, sortOrder: 3 },
  { name: 'Extra Large', label: 'Extra Large', width: 16, height: 16, depth: 16, sortOrder: 4 },
];

export default function DimensionsPage() {
  const [dimensions, setDimensions] = useState<Array<{ id: string; name: string; label?: string; width?: number; height?: number; depth?: number; sortOrder?: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', label: '', width: '', height: '', depth: '' });
  const [dimSearch, setDimSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch dimensions from API on mount
  useEffect(() => {
    const fetchDimensions = async () => {
      try {
        let res = await fetch('/api/attributes/dimensions');
        if (!res.ok) throw new Error('Failed to fetch dimensions');
        let data = await res.json();
        let dimensionsData = data.data || [];

        // Seed database if empty
        if (dimensionsData.length === 0) {
          for (const seedDimension of SEED_DIMENSIONS) {
            const seedRes = await fetch('/api/attributes/dimensions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedDimension),
            });
            if (!seedRes.ok) {
              console.error('Failed to seed dimension:', seedDimension.name);
            }
          }
          // Fetch again after seeding
          res = await fetch('/api/attributes/dimensions');
          data = await res.json();
          dimensionsData = data.data || [];
        }

        setDimensions(dimensionsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dimensions');
        console.error('Error fetching dimensions:', err);
      }
    };

    fetchDimensions();
  }, []);

  const handleAdd = async () => {
    if (!formData.name || !formData.label) return;

    try {
      const res = await fetch('/api/attributes/dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          label: formData.label,
          width: formData.width ? parseFloat(formData.width) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
          depth: formData.depth ? parseFloat(formData.depth) : undefined,
          sortOrder: Math.max(...dimensions.map(d => d.sortOrder || 0), 0) + 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create dimension');

      const data = await res.json();
      setDimensions([...dimensions, data.data]);
      setFormData({ name: '', label: '', width: '', height: '', depth: '' });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add dimension');
    }
  };

  const handleEdit = (dimension: typeof dimensions[0]) => {
    setEditingId(dimension.id);
    setFormData({
      name: dimension.name,
      label: dimension.label || '',
      width: dimension.width?.toString() || '',
      height: dimension.height?.toString() || '',
      depth: dimension.depth?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name || !formData.label) return;

    try {
      const res = await fetch(`/api/attributes/dimensions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          label: formData.label,
          width: formData.width ? parseFloat(formData.width) : undefined,
          height: formData.height ? parseFloat(formData.height) : undefined,
          depth: formData.depth ? parseFloat(formData.depth) : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to update dimension');

      const data = await res.json();
      setDimensions(dimensions.map(d => d.id === editingId ? data.data : d));
      setFormData({ name: '', label: '', width: '', height: '', depth: '' });
      setEditingId(null);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dimension');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attributes/dimensions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete dimension');

      setDimensions(dimensions.filter(d => d.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete dimension');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', label: '', width: '', height: '', depth: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredDimensions = dimensions.filter(d =>
    d.name.toLowerCase().includes(dimSearch.toLowerCase()) ||
    (d.label || '').toLowerCase().includes(dimSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/attributes" className="mt-2 p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Attributes</p>
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Dimensions</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">Size presets (W × H × D)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{dimensions.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Presets</span>
          </div>
          <button
            onClick={() => { setEditingId(null); setFormData({ name: '', label: '', width: '', height: '', depth: '' }); setShowForm(!showForm) }}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add Dimension
          </button>
        </div>
      </div>

      {/* ── Add/Edit form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6">
          <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-5">
            {editingId ? 'Edit Dimension' : 'New Dimension'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Small"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={e => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., S"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['width', 'height', 'depth'] as const).map(dim => (
                <div key={dim}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">{dim} (cm)</label>
                  <input
                    type="number"
                    value={formData[dim]}
                    onChange={e => setFormData({ ...formData, [dim]: e.target.value })}
                    placeholder="0"
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="flex-1 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors">
                {editingId ? 'Save Changes' : 'Add Dimension'}
              </button>
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or label…"
          value={dimSearch}
          onChange={e => setDimSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
        />
        {dimSearch && (
          <button onClick={() => setDimSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Dimensions card list ── */}
      {filteredDimensions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Ruler className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {dimSearch ? 'No matching dimensions' : 'No dimensions yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {dimSearch ? `No results for "${dimSearch}"` : 'Add size presets to get started.'}
            </p>
            {dimSearch ? (
              <button onClick={() => setDimSearch('')} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">Clear search</button>
            ) : (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add first dimension
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <ul className="divide-y divide-[#E8E0D5]">
            {filteredDimensions.map(dim => (
              <li key={dim.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-cream/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-charcoal-100 flex items-center justify-center flex-shrink-0">
                  <Ruler className="w-4 h-4 text-charcoal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-charcoal-900">{dim.name}</p>
                    {dim.label && dim.label !== dim.name && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 bg-charcoal-100 px-1.5 py-0.5 rounded">
                        {dim.label}
                      </span>
                    )}
                  </div>
                  {(dim.width || dim.height || dim.depth) && (
                    <p className="text-xs font-mono text-charcoal-400 mt-0.5">
                      {dim.width ?? '—'} × {dim.height ?? '—'} × {dim.depth ?? '—'} cm
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(dim)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream hover:bg-terracotta/10 text-charcoal-400 hover:text-terracotta transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dim.id)}
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
    </div>
  )
}
