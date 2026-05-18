'use client';

import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Upload, Search, X as XIcon, Layers } from 'lucide-react';
import { useState, useEffect } from 'react';
import ImageCropUpload from '@/components/common/ImageCropUpload';

const SEED_TEXTURES = [
  { name: 'Smooth', description: 'Polished and smooth finish', sortOrder: 1 },
  { name: 'Rough', description: 'Textured and rough surface', sortOrder: 2 },
  { name: 'Glazed', description: 'Shiny glazed coating', sortOrder: 3 },
];

export default function TexturesPage() {
  const [textures, setTextures] = useState<Array<{ id: string; name: string; description?: string; imageUrl?: string; sortOrder?: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCropUpload, setShowCropUpload] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', imageUrl: '' });
  const [textureSearch, setTextureSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hoveredTextureId, setHoveredTextureId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Fetch textures from API on mount
  useEffect(() => {
    const fetchTextures = async () => {
      try {
        let res = await fetch('/api/attributes/textures');
        if (!res.ok) throw new Error('Failed to fetch textures');
        let data = await res.json();
        let texturesData = data.data || [];

        // Seed database if empty
        if (texturesData.length === 0) {
          for (const seedTexture of SEED_TEXTURES) {
            const seedRes = await fetch('/api/attributes/textures', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedTexture),
            });
            if (!seedRes.ok) {
              console.error('Failed to seed texture:', seedTexture.name);
            }
          }
          // Fetch again after seeding
          res = await fetch('/api/attributes/textures');
          data = await res.json();
          texturesData = data.data || [];
        }

        setTextures(texturesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load textures');
        console.error('Error fetching textures:', err);
      }
    };

    fetchTextures();
  }, []);

  const handleAdd = async () => {
    if (!formData.name) return;

    try {
      const res = await fetch('/api/attributes/textures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl || null,
          sortOrder: Math.max(...textures.map(t => t.sortOrder || 0), 0) + 1,
        }),
      });

      if (!res.ok) throw new Error('Failed to create texture');

      const data = await res.json();
      setTextures([...textures, data.data]);
      setFormData({ name: '', description: '', imageUrl: '' });
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add texture');
    }
  };

  const handleEdit = (texture: typeof textures[0]) => {
    setEditingId(texture.id);
    setFormData({ name: texture.name, description: texture.description || '', imageUrl: texture.imageUrl || '' });
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name) return;

    try {
      const res = await fetch(`/api/attributes/textures/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update texture');

      const data = await res.json();
      setTextures(textures.map(t => t.id === editingId ? data.data : t));
      setFormData({ name: '', description: '', imageUrl: '' });
      setEditingId(null);
      setShowForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update texture');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attributes/textures/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete texture');

      setTextures(textures.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete texture');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', imageUrl: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredTextures = textures.filter(t =>
    t.name.toLowerCase().includes(textureSearch.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(textureSearch.toLowerCase())
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
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Textures</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">Surface texture finishes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{textures.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Textures</span>
          </div>
          <button
            onClick={() => { setEditingId(null); setFormData({ name: '', description: '', imageUrl: '' }); setShowForm(!showForm) }}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add Texture
          </button>
        </div>
      </div>

      {/* ── Add/Edit form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6">
          <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-5">
            {editingId ? 'Edit Texture' : 'New Texture'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Smooth"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Polished and smooth finish"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400">Texture Image</label>
              <button
                type="button"
                onClick={() => setShowCropUpload(true)}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#E8E0D5] hover:border-terracotta hover:bg-terracotta/5 rounded-xl py-3 transition-all text-sm text-charcoal-500 hover:text-terracotta font-semibold"
              >
                <Upload className="w-4 h-4" />
                Upload &amp; Crop Image
              </button>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="Or paste image URL…"
                className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
              />
            </div>
            {formData.imageUrl && (
              <div className="w-20 h-20 rounded-xl border border-[#E8E0D5] overflow-hidden shadow-sm">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="flex-1 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors">
                {editingId ? 'Save Changes' : 'Add Texture'}
              </button>
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Upload Modal */}
      {showCropUpload && (
        <ImageCropUpload
          onImageUrl={(url) => setFormData({ ...formData, imageUrl: url })}
          onClose={() => setShowCropUpload(false)}
        />
      )}

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or description…"
          value={textureSearch}
          onChange={e => setTextureSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
        />
        {textureSearch && (
          <button onClick={() => setTextureSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Texture card grid ── */}
      {filteredTextures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Layers className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {textureSearch ? 'No matching textures' : 'No textures yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {textureSearch ? `No results for "${textureSearch}"` : 'Add your first texture to get started.'}
            </p>
            {textureSearch ? (
              <button onClick={() => setTextureSearch('')} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">Clear search</button>
            ) : (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add first texture
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredTextures.map(texture => (
            <div key={texture.id} className="group relative bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden hover:border-terracotta/30 hover:shadow-warm-sm transition-all duration-200">
              {/* Image */}
              <div className="aspect-square bg-cream relative overflow-hidden">
                {texture.imageUrl ? (
                  <img src={texture.imageUrl} alt={texture.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layers className="w-8 h-8 text-charcoal-200" />
                  </div>
                )}
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(texture)}
                    className="w-7 h-7 rounded-lg bg-white/95 shadow-sm flex items-center justify-center text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ id: texture.id, name: texture.name })}
                    className="w-7 h-7 rounded-lg bg-white/95 shadow-sm flex items-center justify-center text-charcoal-300 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-charcoal-900 truncate">{texture.name}</p>
                {texture.description && (
                  <p className="text-[11px] text-charcoal-400 mt-0.5 line-clamp-2 leading-relaxed">{texture.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E8E0D5] w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-charcoal-900 text-sm">Delete Texture</p>
                <p className="text-xs text-charcoal-400 mt-0.5">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-charcoal-600">
              Are you sure you want to delete <span className="font-semibold text-charcoal-900">"{deleteConfirm.name}"</span>? Any products using this texture will lose this association.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold hover:bg-cream transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDelete(deleteConfirm.id); setDeleteConfirm(null) }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
