/**
 * ProductionApprovalForm - Manager approves order and sets timeline
 * Used by managers to review and approve production orders
 */

'use client';

import { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface ProductionApprovalFormProps {
  orderNumber: string;
  vendor: {
    name: string;
    email: string;
  };
  items: any[];
  total: number;
  onApprove: (data: {
    estimatedDays: number;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ProductionApprovalForm({
  orderNumber,
  vendor,
  items,
  total,
  onApprove,
  isLoading = false,
}: ProductionApprovalFormProps) {
  const [estimatedDays, setEstimatedDays] = useState(14);
  const [priority, setPriority] = useState<'NORMAL'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!estimatedDays || estimatedDays <= 0) {
      newErrors.estimatedDays = 'Estimated days must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onApprove({
        estimatedDays,
        priority: priority as any,
        notes,
      });
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Approve Production Order</h2>
        <p className="text-gray-600 mt-1">{orderNumber}</p>
      </div>

      {/* Order Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Vendor</p>
            <p className="font-semibold text-gray-900">{vendor.name}</p>
            <p className="text-xs text-gray-500 mt-1">{vendor.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items</p>
            <p className="font-semibold text-gray-900">
              {items.reduce((sum, item) => sum + item.quantity, 0)} units
            </p>
            <p className="text-xs text-gray-500 mt-1">{items.length} line items</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="font-semibold text-gray-900">AED {total.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Items to Produce</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.description}</p>
                <p className="text-xs text-gray-500">
                  {item.specifications && JSON.stringify(item.specifications)}
                </p>
              </div>
              <p className="font-semibold text-gray-900">Qty: {item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Days */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Estimated Production Days
        </label>
        <input
          type="number"
          min="1"
          max="365"
          value={estimatedDays}
          onChange={(e) => {
            setEstimatedDays(parseInt(e.target.value));
            setErrors({ ...errors, estimatedDays: '' });
          }}
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 ${
            errors.estimatedDays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.estimatedDays && <p className="text-red-600 text-sm mt-1">{errors.estimatedDays}</p>}

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-semibold">Estimated Completion</p>
            <p className="text-sm text-blue-800">{estimatedDate.toLocaleDateString()} (in {estimatedDays} days)</p>
          </div>
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Production Priority
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setPriority(level as any)}
              className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                priority === level
                  ? level === 'URGENT'
                    ? 'bg-red-600 text-white ring-2 ring-red-400'
                    : level === 'HIGH'
                      ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                      : 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Manager Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Manager Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions, concerns, or notes for the production team..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-900">Before Approving</p>
          <ul className="text-xs text-yellow-800 mt-1 space-y-1">
            <li>✓ Verify all items and specifications are correct</li>
            <li>✓ Confirm estimated production time with team</li>
            <li>✓ Check for any material availability issues</li>
          </ul>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-lg transition-colors text-lg"
      >
        {isLoading ? 'Approving...' : 'Approve & Start Production'}
      </button>
    </form>
  );
}
