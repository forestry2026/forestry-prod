'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface ProductSearchBarProps {
  onSearchResults: (term: string) => void;
}

export function ProductSearchBar({ onSearchResults }: ProductSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    onSearchResults(term);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearchResults('');
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-charcoal/40" />
        <input
          type="text"
          placeholder="Search products by name, SKU, specifications, or category..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ borderWidth: '0.5px' }}
          className="w-full pl-12 pr-10 py-3 bg-cream/30 border border-cream-darker rounded-lg focus:border-terracotta transition text-charcoal placeholder-charcoal/40 outline-none"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-4 text-charcoal/40 hover:text-charcoal transition"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
