/**
 * Admin Quotation Details Page
 * View quotation, send to vendor, track responses
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuotationDetails from '@/components/quotations/QuotationDetails';
import { Mail, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// Type definition for quotation
interface Quotation {
  id: string;
  status: string;
  rfp: any;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  validUntil: Date;
  terms: string;
  notes: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  createdAt: Date;
  createdByUser: any;
}

// Dummy data for demonstration
const DUMMY_QUOTATION: Quotation = {
  id: 'quot-001',
  status: 'DRAFT',
  rfp: {
    rfpNumber: 'RFP-2026-0001',
    vendorProfile: {
      id: 'vendor-001',
      companyName: 'Al Jazeera Ceramics',
      user: {
        email: 'contact@aljazeera.ae',
      },
    },
  },
  items: [
    {
      id: 'item-001',
      description: 'Large Terracotta Pot - Premium Grade',
      specifications: JSON.stringify({
        size: 'Large (24" height)',
        color: 'Terracotta',
        texture: 'Smooth',
        finish: 'Matte',
      }),
      quantity: 100,
      unitPrice: 45,
      totalPrice: 4500,
    },
    {
      id: 'item-002',
      description: 'Medium Decorative Pot - Hand-Painted',
      specifications: JSON.stringify({
        size: 'Medium (16" height)',
        color: 'Custom Blue',
        texture: 'Hammered',
        finish: 'Glossy',
      }),
      quantity: 150,
      unitPrice: 35,
      totalPrice: 5250,
    },
  ],
  subtotal: 9750,
  tax: 780,
  total: 10530,
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  terms: 'Payment: 50% upfront, 50% on delivery\nDelivery: FOB Dubai Port\nValid for 30 days',
  notes: 'Bulk order discount of 5% applied. Delivery in 2 shipments.',
  sentAt: null,
  respondedAt: null,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  createdByUser: {
    name: 'Sarah Admin',
    email: 'sarah@forestry.com',
  },
};

export default function QuotationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const [quotation, setQuotation] = useState(DUMMY_QUOTATION);
  const [isSending, setIsSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const handleSendQuotation = async () => {
    setIsSending(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setQuotation((prev) => ({
        ...prev,
        status: 'SENT',
        sentAt: new Date() as Date | null,
      }));
      setShowSendConfirm(false);
    } catch (error) {
      console.error('Error sending quotation:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotations
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{quotation.rfp.vendorProfile.companyName}</h1>
          <p className="text-gray-600 mt-1">RFP: {quotation.rfp.rfpNumber}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Quotation Details */}
          <QuotationDetails quotation={quotation} />

          {/* Vendor Info Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Vendor Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-semibold text-gray-900">{quotation.rfp.vendorProfile.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900 break-all">
                  {quotation.rfp.vendorProfile.user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quotation Status & Actions</h2>

            {/* Current Status */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                {quotation.status === 'DRAFT' && (
                  <>
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-900">Draft - Not Sent</p>
                      <p className="text-sm text-yellow-700">Review and send to vendor</p>
                    </div>
                  </>
                )}
                {quotation.status === 'SENT' && (
                  <>
                    <Mail className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-900">Sent to Vendor</p>
                      <p className="text-sm text-blue-700">Sent on {quotation.sentAt?.toLocaleDateString()}</p>
                    </div>
                  </>
                )}
                {quotation.status === 'APPROVED' && (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Approved by Vendor</p>
                      <p className="text-sm text-green-700">
                        Approved on {quotation.respondedAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {quotation.status === 'DRAFT' && !showSendConfirm && (
              <button
                onClick={() => setShowSendConfirm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Quotation to Vendor
              </button>
            )}

            {/* Send Confirmation */}
            {showSendConfirm && (
              <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Send quotation to:</p>
                  <p className="text-gray-700 p-3 bg-white rounded border border-gray-300">
                    {quotation.rfp.vendorProfile.user.email}
                  </p>
                </div>
                <p className="text-sm text-gray-700">
                  The vendor will receive an email with a link to view and respond to this quotation.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSendQuotation}
                    disabled={isSending}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    {isSending ? 'Sending...' : 'Confirm & Send'}
                  </button>
                  <button
                    onClick={() => setShowSendConfirm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {quotation.status === 'SENT' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-900 font-semibold mb-2">Awaiting Vendor Response</p>
                <p className="text-sm text-blue-800">
                  This quotation is valid until {quotation.validUntil.toLocaleDateString()}
                </p>
              </div>
            )}

            {quotation.status === 'APPROVED' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-900 font-semibold mb-2">✓ Quotation Approved</p>
                <p className="text-sm text-green-800">
                  The order has been moved to production queue. A production order has been created.
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-6 text-sm text-gray-600 space-y-2">
            <p>
              <span className="font-semibold">Created by:</span> {quotation.createdByUser.name}
            </p>
            <p>
              <span className="font-semibold">Created on:</span> {quotation.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
