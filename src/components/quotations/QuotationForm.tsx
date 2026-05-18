'use client';

import { useState } from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';

interface QuotationFormProps {
  rfpId: string;
  rfpItems: Array<{
    id: string;
    product: { name: string };
    quantity: number;
    dimension?: { name: string };
    color?: { name: string };
    texture?: { name: string };
    finish?: { name: string };
    notes?: string;
  }>;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormItem {
  rfpItemId: string;
  unitPrice: number;
}

export default function QuotationForm({ rfpId, rfpItems, onClose, onSuccess }: QuotationFormProps) {
  const [items, setItems] = useState<FormItem[]>(
    rfpItems.map((item) => ({
      rfpItemId: item.id,
      unitPrice: 0,
    }))
  );
  const [validityDays, setValidityDays] = useState(30);
  const [taxPercentage, setTaxPercentage] = useState(8);
  const [terms, setTerms] = useState('Payment: 50% upfront, 50% on delivery\nDelivery: FOB Dubai Port');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate totals
  const subtotal = items.reduce((sum, item, idx) => {
    return sum + item.unitPrice * rfpItems[idx].quantity;
  }, 0);

  const tax = Math.round((subtotal * taxPercentage) / 100 * 100) / 100;
  const total = subtotal + tax;

  const handlePriceChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].unitPrice = parseFloat(value) || 0;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate all prices are set
      if (items.some((item) => item.unitPrice <= 0)) {
        setError('Please enter valid prices for all items');
        setIsLoading(false);
        return;
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      const quotationItems = items.map((item, idx) => ({
        rfpItemId: item.rfpItemId,
        description: rfpItems[idx].product.name,
        specifications: JSON.stringify({
          dimension: rfpItems[idx].dimension?.name || '-',
          color: rfpItems[idx].color?.name || '-',
          texture: rfpItems[idx].texture?.name || '-',
          finish: rfpItems[idx].finish?.name || '-',
        }),
        quantity: rfpItems[idx].quantity,
        unitPrice: item.unitPrice,
      }));

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfpId,
          items: quotationItems,
          subtotal: Math.round(subtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          validUntil: validUntil.toISOString(),
          terms,
          notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create quotation');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cream-darker sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-charcoal">Create Quotation</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-cream rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Items Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-charcoal text-lg">Item Pricing</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream border-b border-cream-darker">
                    <th className="px-4 py-2 text-left font-semibold text-charcoal">Product</th>
                    <th className="px-4 py-2 text-left font-semibold text-charcoal">Qty</th>
                    <th className="px-4 py-2 text-right font-semibold text-charcoal">Unit Price (AED)</th>
                    <th className="px-4 py-2 text-right font-semibold text-charcoal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rfpItems.map((rfpItem, idx) => {
                    const itemTotal = items[idx].unitPrice * rfpItem.quantity;
                    return (
                      <tr key={rfpItem.id} className="border-b border-cream-darker hover:bg-cream/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-charcoal">{rfpItem.product.name}</p>
                            <p className="text-xs text-charcoal/60 mt-1">
                              {[
                                rfpItem.dimension?.name,
                                rfpItem.color?.name,
                                rfpItem.texture?.name,
                                rfpItem.finish?.name,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-charcoal">{rfpItem.quantity}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={items[idx].unitPrice || ''}
                            onChange={(e) => handlePriceChange(idx, e.target.value)}
                            placeholder="0.00"
                            disabled={isLoading}
                            className="w-24 px-3 py-2 border border-cream-darker rounded-lg focus:outline-none focus:border-terracotta text-right"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-charcoal">
                          {itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-cream/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-charcoal">Subtotal:</span>
              <span className="font-semibold text-charcoal">AED {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal">Tax ({taxPercentage}%):</span>
              <span className="font-semibold text-charcoal">AED {tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-cream-darker pt-2 flex justify-between">
              <span className="font-semibold text-charcoal">Total:</span>
              <span className="font-bold text-terracotta text-lg">AED {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Quote Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Valid For (Days)</label>
              <input
                type="number"
                min="1"
                max="365"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-cream-darker rounded-lg focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Tax %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-cream-darker rounded-lg focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Payment Terms</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                disabled={isLoading}
                rows={3}
                className="w-full px-4 py-2 border border-cream-darker rounded-lg focus:outline-none focus:border-terracotta"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal mb-2">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isLoading}
                rows={2}
                placeholder="E.g., Bulk discount applied, special delivery terms..."
                className="w-full px-4 py-2 border border-cream-darker rounded-lg focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-cream-darker">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-2 border border-cream-darker text-charcoal font-semibold rounded-lg hover:bg-cream transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-2 bg-terracotta hover:bg-terracotta-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Quotation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
