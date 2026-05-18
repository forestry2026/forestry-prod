'use client';

import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Search, X as XIcon, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

const SEED_FINISHES = [
  { name: 'Matte', description: 'Non-reflective finish', sortOrder: 1 },
  { name: 'Gloss', description: 'Shiny reflective finish', sortOrder: 2 },
  { name: 'Satin', description: 'Semi-glossy finish', sortOrder: 3 },
];

export default function FinishesPage() {
  const [finishes, setFinishes] = useState<Array<{ id: string; name: string; description?: string; sortOrder?: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [finishSearch, setFinishSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch finishes from API on mount
  useEffect(() => {
    const fetchFinishes = async () => {
      try {
        let res = await fetch('/api/attributes/finishes');
        if (!res.ok) throw new Error('Failed to fetch finishes');
        let data = await res.json();
        let finishesData = data.data || [];

        // Seed database if empty
        if (finishesData.length === 0) {
          for (const seedFinish of SEED_FINISHES) {
            const seedRes = await fetch('/api/attributes/finishes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedFinish),
            });
            if (!seedRes.ok) {
              console.error('Failed to seed finish:', seedFinish.name);
            }
          }
          // Fetch again after seeding
          res = await fetch('/api/attributes/finishes');
          data = await res.json();
          finishesData = data.data || [];
        }

        setFinishes(finishesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load finishes');
        console.error('Error fetching finishes:', err);
      }
    };

    fetchFinishes();
  }, []);

  const handleAdd = async () => {
    if (!formData.name) return;

    try {
      const res = await fetch('/api/attributes/finishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          sortOrder: Math.max(...finishes.map(f => f.sortOrder || 0), 0) + 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create finish');

      const data = await res.json();
      setFinishes([...finishes, data.data]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add finish');
    }
  };

  const handleEdit = (finish: typeof finishes[0]) => {
    setEditingId(finish.id);
    setFormData({ name: finish.name, description: finish.description || '' });
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name) return;

    try {
      const res = await fetch(`/api/attributes/finishes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (!res.ok) throw new Error('Failed to update finish');

      const data = await res.json();
      setFinishes(finishes.map(f => f.id === editingId ? data.data : f));
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update finish');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attributes/finishes/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete finish');

      setFinishes(finishes.filter(f => f.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete finish');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredFinishes = finishes.filter(f =>
    f.name.toLowerCase().includes(finishSearch.toLowerCase()) ||
    (f.description || '').toLowerCase().includes(finishSearch.toLowerCase())
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
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Finishes</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">Gloss, matte &amp; satin types</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{finishes.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Finishes</span>
          </div>
          <button
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); setShowForm(!showForm) }}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add Finish
          </button>
        </div>
      </div>

      {/* ── Add/Edit form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6">
          <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-5">
            {editingId ? 'Edit Finish' : 'New Finish'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Matte"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Non-reflective finish"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="flex-1 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors">
                {editingId ? 'Save Changes' : 'Add Finish'}
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
          placeholder="Search by name or description…"
          value={finishSearch}
          onChange={e => setFinishSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
        />
        {finishSearch && (
          <button onClick={() => setFinishSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Finishes card list ── */}
      {filteredFinishes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {finishSearch ? 'No matching finishes' : 'No finishes yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {finishSearch ? `No results for "${finishSearch}"` : 'Add your first finish type to get started.'}
            </p>
            {finishSearch ? (
              <button onClick={() => setFinishSearch('')} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">Clear search</button>
            ) : (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add first finish
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <ul className="divide-y divide-[#E8E0D5]">
            {filteredFinishes.map(finish => (
              <li key={finish.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-cream/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-charcoal-900">{finish.name}</p>
                  {finish.description && (
                    <p className="text-xs text-charcoal-400 mt-0.5 truncate">{finish.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(finish)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream hover:bg-terracotta/10 text-charcoal-400 hover:text-terracotta transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(finish.id)}
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
