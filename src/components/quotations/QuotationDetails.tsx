/**
 * QuotationDetails - Full quotation view
 * Shows all quotation information, items, and actions
 */

'use client';

import { useState } from 'react';
import { DollarSign, Calendar, FileText, Download } from 'lucide-react';

interface QuotationDetailsProps {
  quotation: any;
  isVendor?: boolean;
  onRespond?: (action: 'APPROVE' | 'DECLINE' | 'REQUEST_REVISION', notes?: string) => void;
  isLoading?: boolean;
}

export default function QuotationDetails({
  quotation,
  isVendor = false,
  onRespond,
  isLoading = false,
}: QuotationDetailsProps) {
  const [responseAction, setResponseAction] = useState<'APPROVE' | 'DECLINE' | 'REQUEST_REVISION' | null>(null);
  const [notes, setNotes] = useState('');

  const handleRespond = async () => {
    if (responseAction && onRespond) {
      await onRespond(responseAction, notes);
      setResponseAction(null);
      setNotes('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Details</h1>
            <p className="text-gray-500 mt-1">
              {quotation.rfp?.vendorProfile?.companyName}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              AED {quotation.total?.toFixed(2)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Key Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Valid Until</p>
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <Calendar className="w-4 h-4" />
              {new Date(quotation.validUntil).toLocaleDateString()}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Subtotal</p>
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <DollarSign className="w-4 h-4" />
              {quotation.subtotal?.toFixed(2)}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tax</p>
            <p className="flex items-center gap-2 font-semibold text-gray-900">
              <DollarSign className="w-4 h-4" />
              {quotation.tax?.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-900">Description</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-900">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-900">Unit Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-900">AED {item.unitPrice?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      AED {item.totalPrice?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms & Notes */}
        {quotation.terms && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Terms & Conditions
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
              {quotation.terms}
            </div>
          </div>
        )}

        {quotation.notes && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
              {quotation.notes}
            </div>
          </div>
        )}
      </div>

      {/* Vendor Actions */}
      {isVendor && quotation.status === 'SENT' && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          {!responseAction ? (
            <div className="flex gap-3">
              <button
                onClick={() => setResponseAction('APPROVE')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Approve Quotation
              </button>
              <button
                onClick={() => setResponseAction('REQUEST_REVISION')}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Request Revision
              </button>
              <button
                onClick={() => setResponseAction('DECLINE')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {responseAction === 'APPROVE' && 'Confirm Approval'}
                  {responseAction === 'DECLINE' && 'Reason for Decline'}
                  {responseAction === 'REQUEST_REVISION' && 'Requested Changes'}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    responseAction === 'APPROVE'
                      ? 'Any notes for the admin? (Optional)'
                      : 'Please provide details...'
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRespond}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setResponseAction(null);
                    setNotes('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
