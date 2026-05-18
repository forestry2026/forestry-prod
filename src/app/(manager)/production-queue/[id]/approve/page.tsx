/**
 * Manager Order Approval Page
 * Approve order and set production timeline
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductionApprovalForm from '@/components/production/ProductionApprovalForm';
import { ArrowLeft } from 'lucide-react';

// Dummy data
const DUMMY_ORDER = {
  id: 'prod-001',
  orderNumber: 'PO-2026-0001',
  quotation: {
    rfp: {
      vendorProfile: {
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
          quantity: 100,
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
          quantity: 150,
        }),
        quantity: 150,
        unitPrice: 35,
        totalPrice: 5250,
      },
    ],
    total: 10530,
  },
};

export default function OrderApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order] = useState(DUMMY_ORDER);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalDone, setApprovalDone] = useState(false);

  const handleApprove = async (data: {
    estimatedDays: number;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    notes?: string;
  }) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setApprovalDone(true);
      // Redirect back to queue after 2 seconds
      setTimeout(() => {
        router.push('/manager/production-queue');
      }, 2000);
    } catch (error) {
      console.error('Error approving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Queue
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Production Approval</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {!approvalDone ? (
          <ProductionApprovalForm
            orderNumber={order.orderNumber}
            vendor={{
              name: order.quotation.rfp.vendorProfile.companyName,
              email: order.quotation.rfp.vendorProfile.user.email,
            }}
            items={order.quotation.items}
            total={order.quotation.total}
            onApprove={handleApprove}
            isLoading={isSubmitting}
          />
        ) : (
          /* Success Message */
          <div className="bg-green-50 rounded-lg border border-green-200 p-12 text-center">
            <div className="inline-block mb-4">
              <svg
                className="w-16 h-16 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Order Approved!</h2>
            <p className="text-green-800 mb-6">
              {order.orderNumber} has been approved and sent to the production team
            </p>
            <div className="bg-white rounded-lg p-4 inline-block border border-green-200">
              <p className="text-sm text-gray-600">Redirecting to production queue...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
