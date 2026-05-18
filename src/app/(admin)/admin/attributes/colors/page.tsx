'use client';

import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowLeft, Search, X as XIcon, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';

// Seed initial colors if database is empty
const SEED_COLORS = [
  { name: 'Terracotta', hexCode: '#B35C2A', ralCode: null, sortOrder: 1 },
  { name: 'Sage', hexCode: '#87A878', ralCode: null, sortOrder: 2 },
  { name: 'Cream', hexCode: '#FAF7F2', ralCode: null, sortOrder: 3 },
  { name: 'Charcoal', hexCode: '#2D3436', ralCode: null, sortOrder: 4 },
  { name: 'Natural White', hexCode: '#F7FAFC', ralCode: null, sortOrder: 5 },
  { name: 'Sand Beige', hexCode: '#D4A574', ralCode: null, sortOrder: 6 },
  { name: 'Forest Green', hexCode: '#2D5016', ralCode: null, sortOrder: 7 },
];

// Comprehensive RAL Classic Colors (1000-9011)
const RAL_COLORS = [
  // 1000 Series - Yellows
  { ral: '1000', name: 'Green Beige', hex: '#C4B5A0' },
  { ral: '1001', name: 'Beige', hex: '#C6A664' },
  { ral: '1002', name: 'Sand Yellow', hex: '#C1A50D' },
  { ral: '1003', name: 'Signal Yellow', hex: '#E5A628' },
  { ral: '1004', name: 'Golden Yellow', hex: '#E4A010' },
  { ral: '1005', name: 'Honey Yellow', hex: '#C7A82D' },
  { ral: '1006', name: 'Maize Yellow', hex: '#E4C414' },
  { ral: '1007', name: 'Daffodil Yellow', hex: '#DCA71C' },
  { ral: '1011', name: 'Brown Beige', hex: '#8B6F47' },
  { ral: '1012', name: 'Lemon Yellow', hex: '#C9D71C' },
  { ral: '1013', name: 'Oyster White', hex: '#E6D7C3' },
  { ral: '1014', name: 'Ivory', hex: '#DCC9A6' },
  { ral: '1015', name: 'Light Ivory', hex: '#E6D5B8' },
  { ral: '1016', name: 'Sulfur Yellow', hex: '#F3DA0B' },
  { ral: '1017', name: 'Saffron Yellow', hex: '#F5AF1D' },
  { ral: '1018', name: 'Zinc Yellow', hex: '#F8F32B' },
  { ral: '1019', name: 'Grey Beige', hex: '#9B9B7A' },
  { ral: '1020', name: 'Olive Yellow', hex: '#9B9B2F' },
  { ral: '1021', name: 'Rape Yellow', hex: '#F3DA0B' },
  { ral: '1023', name: 'Traffic Yellow', hex: '#F4A900' },
  { ral: '1024', name: 'Ochre Yellow', hex: '#A68B5B' },
  { ral: '1025', name: 'Cream', hex: '#F0E68C' },
  { ral: '1026', name: 'Luminous Yellow', hex: '#FFFF00' },
  { ral: '1027', name: 'Curry Yellow', hex: '#B8860B' },
  { ral: '1028', name: 'Melon Yellow', hex: '#F4A460' },
  { ral: '1032', name: 'Broom Yellow', hex: '#D4AF37' },
  { ral: '1033', name: 'Dahlia Yellow', hex: '#F5AF1D' },
  { ral: '1034', name: 'Pastel Yellow', hex: '#EDD5B1' },
  { ral: '1035', name: 'Pearl Beige', hex: '#C9B59A' },
  { ral: '1036', name: 'Pearl Gold', hex: '#C9B35D' },
  { ral: '1037', name: 'Sun Yellow', hex: '#F5AF1D' },
  { ral: '1038', name: 'Lemon Yellow', hex: '#F4E4A6' },

  // 2000 Series - Reds
  { ral: '2000', name: 'Yellow Red', hex: '#DA291C' },
  { ral: '2001', name: 'Red Orange', hex: '#D95830' },
  { ral: '2002', name: 'Vermillion', hex: '#CB2821' },
  { ral: '2003', name: 'Pastel Orange', hex: '#FF7514' },
  { ral: '2004', name: 'Pure Orange', hex: '#F77038' },
  { ral: '2005', name: 'Luminous Orange', hex: '#FF2400' },
  { ral: '2007', name: 'Luminous Bright Orange', hex: '#FF7514' },
  { ral: '2008', name: 'Bright Red Orange', hex: '#F75860' },
  { ral: '2009', name: 'Traffic Orange', hex: '#F76D5E' },
  { ral: '2010', name: 'Signal Orange', hex: '#D84830' },
  { ral: '2011', name: 'Deep Orange', hex: '#EC7C26' },
  { ral: '2012', name: 'Salmon Orange', hex: '#E74C3C' },
  { ral: '2013', name: 'Pearl Orange', hex: '#C1440E' },

  // 3000 Series - Reds
  { ral: '3000', name: 'Flame Red', hex: '#AB2524' },
  { ral: '3001', name: 'Signal Red', hex: '#A32C2A' },
  { ral: '3002', name: 'Carmine Red', hex: '#A2231D' },
  { ral: '3003', name: 'Ruby Red', hex: '#78281F' },
  { ral: '3004', name: 'Purple Red', hex: '#75151E' },
  { ral: '3005', name: 'Wine Red', hex: '#5E2129' },
  { ral: '3007', name: 'Black Red', hex: '#412227' },
  { ral: '3009', name: 'Oxide Red', hex: '#5C3D2E' },
  { ral: '3011', name: 'Brown Red', hex: '#5C2E2A' },
  { ral: '3012', name: 'Beige Red', hex: '#8C7967' },
  { ral: '3013', name: 'Tomato Red', hex: '#8B4141' },
  { ral: '3014', name: 'Antique Pink', hex: '#D291BC' },
  { ral: '3015', name: 'Light Pink', hex: '#E1A6C8' },
  { ral: '3016', name: 'Coral Red', hex: '#B32428' },
  { ral: '3017', name: 'Rose', hex: '#E63244' },
  { ral: '3018', name: 'Strawberry Red', hex: '#D53C3D' },
  { ral: '3020', name: 'Traffic Red', hex: '#CC0605' },
  { ral: '3022', name: 'Salmon Pink', hex: '#D75C7A' },
  { ral: '3024', name: 'Luminous Red', hex: '#F80000' },
  { ral: '3026', name: 'Luminous Bright Red', hex: '#FF0000' },
  { ral: '3027', name: 'Raspberry Red', hex: '#B32428' },
  { ral: '3028', name: 'Pure Red', hex: '#C71585' },
  { ral: '3031', name: 'Orient Red', hex: '#B32428' },

  // 4000 Series - Purples/Pinks
  { ral: '4001', name: 'Red Lilac', hex: '#6B4C9A' },
  { ral: '4002', name: 'Red Violet', hex: '#922B3E' },
  { ral: '4003', name: 'Heather Violet', hex: '#D570A9' },
  { ral: '4004', name: 'Claret Violet', hex: '#641E16' },
  { ral: '4005', name: 'Blue Lilac', hex: '#6C5B95' },
  { ral: '4006', name: 'Traffic Purple', hex: '#A3006F' },
  { ral: '4007', name: 'Purple Black', hex: '#4A0E4E' },
  { ral: '4008', name: 'Signal Violet', hex: '#924E7D' },
  { ral: '4009', name: 'Pastel Violet', hex: '#A18594' },
  { ral: '4010', name: 'Telemagenta', hex: '#CE0B72' },
  { ral: '4011', name: 'Pearl Violet', hex: '#8673A1' },
  { ral: '4012', name: 'Pearl Black Berry', hex: '#474457' },

  // 5000 Series - Blues
  { ral: '5000', name: 'Violet Blue', hex: '#354D73' },
  { ral: '5001', name: 'Green Blue', hex: '#1F3A70' },
  { ral: '5002', name: 'Ultramarine Blue', hex: '#20214F' },
  { ral: '5003', name: 'Sapphire Blue', hex: '#1E213D' },
  { ral: '5004', name: 'Black Blue', hex: '#18202F' },
  { ral: '5005', name: 'Signal Blue', hex: '#003DA5' },
  { ral: '5006', name: 'Traffic Blue', hex: '#004687' },
  { ral: '5007', name: 'Brilliant Blue', hex: '#3E5C76' },
  { ral: '5008', name: 'Grey Blue', hex: '#26394F' },
  { ral: '5009', name: 'Azure Blue', hex: '#025669' },
  { ral: '5010', name: 'Gentian Blue', hex: '#0E294B' },
  { ral: '5011', name: 'Steel Blue', hex: '#1C3144' },
  { ral: '5012', name: 'Light Blue', hex: '#3B82BE' },
  { ral: '5013', name: 'Cobalt Blue', hex: '#1E3A5C' },
  { ral: '5014', name: 'Pigeon Blue', hex: '#606E8C' },
  { ral: '5015', name: 'Sky Blue', hex: '#2E8BC0' },
  { ral: '5016', name: 'Cadet Blue', hex: '#252D3D' },
  { ral: '5017', name: 'Traffic Blue', hex: '#063971' },
  { ral: '5018', name: 'Turquoise Blue', hex: '#1B6B82' },
  { ral: '5019', name: 'Capri Blue', hex: '#1A3A52' },
  { ral: '5020', name: 'Ocean Blue', hex: '#1C3A47' },
  { ral: '5021', name: 'Water Blue', hex: '#256D7B' },
  { ral: '5022', name: 'Night Blue', hex: '#252D3D' },
  { ral: '5023', name: 'Remote Blue', hex: '#3B5998' },
  { ral: '5024', name: 'Pastel Blue', hex: '#5B9AB8' },
  { ral: '5025', name: 'Pearl Gentian Blue', hex: '#2E5C8A' },
  { ral: '5026', name: 'Pearl Night Blue', hex: '#1C3A47' },

  // 6000 Series - Greens
  { ral: '6000', name: 'Patina Green', hex: '#316B4E' },
  { ral: '6001', name: 'Emerald Green', hex: '#27623D' },
  { ral: '6002', name: 'Leaf Green', hex: '#2D5016' },
  { ral: '6003', name: 'Olive Green', hex: '#424632' },
  { ral: '6004', name: 'Blue Green', hex: '#1F3A3F' },
  { ral: '6005', name: 'Moss Green', hex: '#2F5233' },
  { ral: '6006', name: 'Grey Green', hex: '#3D4D45' },
  { ral: '6007', name: 'Bottle Green', hex: '#242E24' },
  { ral: '6008', name: 'Brown Green', hex: '#39402F' },
  { ral: '6009', name: 'Fir Green', hex: '#26423F' },
  { ral: '6010', name: 'Grass Green', hex: '#35682D' },
  { ral: '6011', name: 'Reseda Green', hex: '#587246' },
  { ral: '6012', name: 'Black Green', hex: '#343E40' },
  { ral: '6013', name: 'Reed Green', hex: '#6D8659' },
  { ral: '6014', name: 'Yellow Olive', hex: '#47402E' },
  { ral: '6015', name: 'Black Olive', hex: '#3D3D33' },
  { ral: '6016', name: 'Turquoise Green', hex: '#00A884' },
  { ral: '6017', name: 'May Green', hex: '#4AA660' },
  { ral: '6018', name: 'Yellow Green', hex: '#548235' },
  { ral: '6019', name: 'Pastel Green', hex: '#B5D61D' },
  { ral: '6020', name: 'Chrome Green', hex: '#323D1F' },
  { ral: '6021', name: 'Pale Green', hex: '#89AC76' },
  { ral: '6022', name: 'Olive Drab', hex: '#3E3C28' },
  { ral: '6024', name: 'Traffic Green', hex: '#308446' },
  { ral: '6025', name: 'Fern Green', hex: '#3D5941' },
  { ral: '6026', name: 'Opal Green', hex: '#015249' },
  { ral: '6027', name: 'Light Green', hex: '#84C65D' },
  { ral: '6028', name: 'Pine Green', hex: '#2D5016' },
  { ral: '6029', name: 'Mint Green', hex: '#20603D' },
  { ral: '6032', name: 'Signal Green', hex: '#317F43' },
  { ral: '6033', name: 'Mint Turquoise', hex: '#49A680' },
  { ral: '6034', name: 'Pastel Turquoise', hex: '#7FB069' },
  { ral: '6035', name: 'Pearl Green', hex: '#2D5016' },
  { ral: '6036', name: 'Pearl Opal Green', hex: '#193737' },
  { ral: '6037', name: 'Pure Green', hex: '#008000' },
  { ral: '6038', name: 'Luminous Green', hex: '#00FF00' },

  // 7000 Series - Greys
  { ral: '7000', name: 'Squirrel Grey', hex: '#78858B' },
  { ral: '7001', name: 'Silver Grey', hex: '#8B99A6' },
  { ral: '7002', name: 'Olive Grey', hex: '#7D8B8E' },
  { ral: '7003', name: 'Moss Grey', hex: '#7E8B7E' },
  { ral: '7004', name: 'Signal Grey', hex: '#969992' },
  { ral: '7005', name: 'Mouse Grey', hex: '#646B63' },
  { ral: '7006', name: 'Beige Grey', hex: '#6D6552' },
  { ral: '7008', name: 'Khaki Grey', hex: '#6D6B63' },
  { ral: '7009', name: 'Green Grey', hex: '#5D6B63' },
  { ral: '7010', name: 'Tarpaulin Grey', hex: '#4A5859' },
  { ral: '7011', name: 'Iron Grey', hex: '#434B4D' },
  { ral: '7012', name: 'Basalt Grey', hex: '#3E4347' },
  { ral: '7013', name: 'Brown Grey', hex: '#54524A' },
  { ral: '7014', name: 'Slate Grey', hex: '#4F5451' },
  { ral: '7015', name: 'Slate Grey', hex: '#434B4D' },
  { ral: '7016', name: 'Anthracite Grey', hex: '#2C3537' },
  { ral: '7017', name: 'Black Grey', hex: '#293133' },
  { ral: '7018', name: 'Grey Brown', hex: '#3D3D33' },
  { ral: '7019', name: 'Black Grey', hex: '#36373D' },
  { ral: '7020', name: 'Black Grey', hex: '#3D4147' },
  { ral: '7021', name: 'Black Grey', hex: '#23262B' },
  { ral: '7022', name: 'Umbra Grey', hex: '#3F3F3F' },
  { ral: '7023', name: 'Grey Concrete', hex: '#7C8186' },
  { ral: '7024', name: 'Graphite Grey', hex: '#474A51' },
  { ral: '7026', name: 'Granite Grey', hex: '#2F3237' },
  { ral: '7030', name: 'Stone Grey', hex: '#8B8680' },
  { ral: '7031', name: 'Blue Grey', hex: '#474F52' },
  { ral: '7032', name: 'Pebble Grey', hex: '#B8B8B0' },
  { ral: '7033', name: 'Cement Grey', hex: '#7F8072' },
  { ral: '7034', name: 'Yellow Grey', hex: '#99927E' },
  { ral: '7035', name: 'Light Grey', hex: '#CBCCC7' },
  { ral: '7036', name: 'Platinum Grey', hex: '#7F7F7F' },
  { ral: '7037', name: 'Dusty Grey', hex: '#7A7A7A' },
  { ral: '7038', name: 'Agate Grey', hex: '#B5B8B1' },
  { ral: '7039', name: 'Quartz Grey', hex: '#6B6B66' },
  { ral: '7040', name: 'Window Grey', hex: '#9A9A9A' },
  { ral: '7042', name: 'Traffic Grey A', hex: '#8D8D8D' },
  { ral: '7043', name: 'Traffic Grey B', hex: '#4E5452' },
  { ral: '7044', name: 'Silk Grey', hex: '#CAC4BC' },
  { ral: '7045', name: 'Telegrey 1', hex: '#909090' },
  { ral: '7046', name: 'Telegrey 2', hex: '#82828D' },
  { ral: '7047', name: 'Telegrey 4', hex: '#D0D0D0' },
  { ral: '7048', name: 'Pearl Mouse Grey', hex: '#898989' },

  // 8000 Series - Browns
  { ral: '8000', name: 'Green Brown', hex: '#6F5D45' },
  { ral: '8001', name: 'Ochre Brown', hex: '#795A3D' },
  { ral: '8002', name: 'Signal Brown', hex: '#6C4621' },
  { ral: '8003', name: 'Clay Brown', hex: '#734222' },
  { ral: '8004', name: 'Copper Brown', hex: '#8B4513' },
  { ral: '8007', name: 'Fawn Brown', hex: '#5A4637' },
  { ral: '8008', name: 'Wood Brown', hex: '#6F4E37' },
  { ral: '8011', name: 'Nut Brown', hex: '#5B3410' },
  { ral: '8012', name: 'Red Brown', hex: '#5A2817' },
  { ral: '8014', name: 'Sepia Brown', hex: '#3D2817' },
  { ral: '8015', name: 'Chestnut Brown', hex: '#5C4033' },
  { ral: '8016', name: 'Mahogany Brown', hex: '#4A235A' },
  { ral: '8017', name: 'Chocolate Brown', hex: '#3E2723' },
  { ral: '8019', name: 'Grey Brown', hex: '#403D39' },
  { ral: '8022', name: 'Black Brown', hex: '#1C1410' },
  { ral: '8023', name: 'Orange Brown', hex: '#A0522D' },
  { ral: '8024', name: 'Beige Brown', hex: '#79553D' },
  { ral: '8025', name: 'Pale Brown', hex: '#755039' },
  { ral: '8028', name: 'Terra Brown', hex: '#4A3728' },
  { ral: '8029', name: 'Pearl Copper', hex: '#9E6B4A' },

  // 9000 Series - Black/White/Grey
  { ral: '9000', name: 'Black', hex: '#221F22' },
  { ral: '9001', name: 'Cream', hex: '#F4F4ED' },
  { ral: '9002', name: 'Grey White', hex: '#E7EBDD' },
  { ral: '9003', name: 'Signal White', hex: '#F8F8F8' },
  { ral: '9004', name: 'Signal Black', hex: '#282828' },
  { ral: '9005', name: 'Jet Black', hex: '#0A0E27' },
  { ral: '9006', name: 'White Aluminium', hex: '#A5ACAF' },
  { ral: '9007', name: 'Grey Aluminium', hex: '#8D7662' },
  { ral: '9008', name: 'Light Grey', hex: '#D7D7D7' },
  { ral: '9009', name: 'Off White', hex: '#E5E5E5' },
  { ral: '9010', name: 'Pure White', hex: '#FFFFFF' },
  { ral: '9011', name: 'Deep Black', hex: '#1C1C1C' },
  { ral: '9012', name: 'Clean White', hex: '#D3D3D3' },
  { ral: '9016', name: 'Traffic White', hex: '#F6F6F6' },
  { ral: '9017', name: 'Traffic Black', hex: '#1A1A1A' },
  { ral: '9018', name: 'Papyrus White', hex: '#D7D5D0' },
];

export default function ColorsPage() {
  const [colors, setColors] = useState<Array<{ id: string; name: string; hexCode?: string; ralCode?: string | null; sortOrder?: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', ralCode: null as string | null });
  const [showRalPicker, setShowRalPicker] = useState(false);
  const [ralSearch, setRalSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch colors from API on mount
  useEffect(() => {
    const fetchColors = async () => {
      try {
        let res = await fetch('/api/attributes/colors');
        if (!res.ok) throw new Error('Failed to fetch colors');
        let data = await res.json();
        let colors = data.data || [];

        // Seed database if empty
        if (colors.length === 0) {
          for (const seedColor of SEED_COLORS) {
            const seedRes = await fetch('/api/attributes/colors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seedColor),
            });
            if (!seedRes.ok) {
              console.error('Failed to seed color:', seedColor.name);
            }
          }
          // Fetch again after seeding
          res = await fetch('/api/attributes/colors');
          data = await res.json();
          colors = data.data || [];
        }

        setColors(colors);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load colors');
      } finally {
        setLoading(false);
      }
    };
    fetchColors();
  }, []);

  const filteredRalColors = RAL_COLORS.filter(
    (color) =>
      color.ral.includes(ralSearch.toLowerCase()) ||
      color.name.toLowerCase().includes(ralSearch.toLowerCase())
  );

  const handleRalSelect = (ral: typeof RAL_COLORS[0]) => {
    setFormData({ name: ral.name, code: ral.hex, ralCode: ral.ral });
    setShowRalPicker(false);
  };

  const handleAdd = async () => {
    if (formData.name && formData.code) {
      try {
        const res = await fetch('/api/attributes/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            hexCode: formData.code,
            ralCode: formData.ralCode,
            sortOrder: Math.max(...colors.map(c => c.sortOrder || 0), 0) + 1,
          }),
        });
        if (!res.ok) throw new Error('Failed to create color');
        const data = await res.json();
        setColors([...colors, data.data]);
        setFormData({ name: '', code: '', ralCode: null });
        setShowForm(false);
        setShowRalPicker(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create color');
      }
    }
  };

  const handleEdit = (color: typeof colors[0]) => {
    setEditingId(color.id);
    setFormData({ name: color.name, code: color.hexCode || '', ralCode: color.ralCode || null });
    setShowForm(true);
  };

  const handleSaveEdit = async () => {
    if (editingId && formData.name && formData.code) {
      try {
        const res = await fetch(`/api/attributes/colors/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            hexCode: formData.code,
            ralCode: formData.ralCode,
          }),
        });
        if (!res.ok) throw new Error('Failed to update color');
        const data = await res.json();
        setColors(colors.map(c =>
          c.id === editingId ? data.data : c
        ));
        setFormData({ name: '', code: '', ralCode: null });
        setEditingId(null);
        setShowForm(false);
        setShowRalPicker(false);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update color');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attributes/colors/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete color');
      setColors(colors.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete color');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', code: '', ralCode: null });
    setEditingId(null);
    setShowForm(false);
    setShowRalPicker(false);
    setRalSearch('');
  };

  const filteredColors = colors.filter(c =>
    c.name.toLowerCase().includes(colorSearch.toLowerCase()) ||
    (c.hexCode || '').toLowerCase().includes(colorSearch.toLowerCase()) ||
    (c.ralCode || '').includes(colorSearch)
  )

  return (
    <div className="space-y-6">

      {/* ── Error ── */}
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
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Colors</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">Manage colour palette &amp; RAL codes</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          {!loading && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
              <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{colors.length}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Colors</span>
            </div>
          )}
          <button
            onClick={() => { setEditingId(null); setFormData({ name: '', code: '', ralCode: null }); setShowForm(!showForm); setShowRalPicker(false) }}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add Color
          </button>
        </div>
      </div>

      {/* ── Add/Edit form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card p-6">
          <h2 className="font-heading text-xl font-bold text-charcoal-900 mb-5">
            {editingId ? 'Edit Color' : 'New Color'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Color Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Terracotta"
                  className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-2">Hex Code</label>
                <div className="flex gap-2">
                  {formData.code && (
                    <div className="w-10 h-10 rounded-lg border border-[#E8E0D5] flex-shrink-0" style={{ backgroundColor: formData.code }} />
                  )}
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="#B35C2A"
                    className="flex-1 px-4 py-2.5 border border-[#E8E0D5] rounded-xl text-sm font-mono text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {formData.ralCode && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">RAL</span>
                <span className="text-sm font-semibold text-amber-700">{formData.ralCode}</span>
                <button onClick={() => setFormData({ ...formData, ralCode: null })} className="ml-auto text-amber-400 hover:text-amber-600">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowRalPicker(!showRalPicker)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:border-terracotta hover:text-terracotta transition-all"
            >
              <Palette className="w-4 h-4" />
              {showRalPicker ? 'Hide RAL Picker' : 'Pick from RAL Palette'}
            </button>

            {showRalPicker && (
              <div className="border border-[#E8E0D5] rounded-2xl p-4 bg-cream/30">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                  <input
                    type="text"
                    value={ralSearch}
                    onChange={e => setRalSearch(e.target.value)}
                    placeholder="Search RAL code or name…"
                    className="flex-1 text-sm text-charcoal-900 bg-transparent outline-none placeholder-charcoal-300"
                  />
                  <span className="text-xs text-charcoal-400 flex-shrink-0">{filteredRalColors.length} results</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-72 overflow-y-auto">
                  {filteredRalColors.map(ral => (
                    <button
                      key={ral.ral}
                      onClick={() => handleRalSelect(ral)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg border border-black/5 flex-shrink-0" style={{ backgroundColor: ral.hex }} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-charcoal-700 truncate">RAL {ral.ral}</p>
                        <p className="text-[10px] text-charcoal-400 truncate">{ral.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={editingId ? handleSaveEdit : handleAdd} className="flex-1 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-colors">
                {editingId ? 'Save Changes' : 'Add Color'}
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
          placeholder="Search by name, hex code, or RAL…"
          value={colorSearch}
          onChange={e => setColorSearch(e.target.value)}
          className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
        />
        {colorSearch && (
          <button onClick={() => setColorSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Color swatch grid ── */}
      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="w-full aspect-square rounded-xl bg-charcoal-100 animate-pulse" />
              <div className="h-2.5 bg-charcoal-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Palette className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {colorSearch ? 'No matching colors' : 'No colors yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {colorSearch ? `No results for "${colorSearch}"` : 'Add your first color to get started.'}
            </p>
            {colorSearch ? (
              <button onClick={() => setColorSearch('')} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                Clear search
              </button>
            ) : (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add first color
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {colorSearch && (
            <p className="text-xs text-charcoal-400 px-1">
              {filteredColors.length} result{filteredColors.length !== 1 ? 's' : ''} for{' '}
              <span className="font-semibold text-charcoal-600">"{colorSearch}"</span>
            </p>
          )}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
            {filteredColors.map(color => (
              <div key={color.id} className="group relative">
                {/* Swatch */}
                <div
                  className="w-full aspect-square rounded-xl border border-black/5 shadow-sm"
                  style={{ backgroundColor: color.hexCode }}
                />
                {/* Labels */}
                <div className="mt-1.5 px-0.5">
                  <p className="text-[11px] font-semibold text-charcoal-800 truncate leading-tight">{color.name}</p>
                  <p className="text-[10px] font-mono text-charcoal-400 truncate">{color.hexCode}</p>
                  {color.ralCode && (
                    <p className="text-[9px] text-charcoal-300 truncate">RAL {color.ralCode}</p>
                  )}
                </div>
                {/* Hover actions */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(color)}
                    className="w-6 h-6 rounded-md bg-white/95 shadow-sm flex items-center justify-center text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(color.id)}
                    className="w-6 h-6 rounded-md bg-white/95 shadow-sm flex items-center justify-center text-charcoal-300 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
