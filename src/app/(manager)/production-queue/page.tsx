/**
 * Manager Production Queue Page
 * View pending orders, approve and set production timeline
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, DollarSign, CheckCircle, Loader } from 'lucide-react';

// Dummy data
const DUMMY_QUEUE = [
  {
    id: 'prod-001',
    orderNumber: 'PO-2026-0001',
    status: 'QUEUED',
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Al Jazeera Ceramics',
        },
      },
      items: [
        {
          description: 'Large Terracotta Pot',
          quantity: 100,
          unitPrice: 45,
          totalPrice: 4500,
        },
        {
          description: 'Medium Decorative Pot',
          quantity: 150,
          unitPrice: 35,
          totalPrice: 5250,
        },
      ],
      total: 10530,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    priority: 'NORMAL',
  },
  {
    id: 'prod-002',
    orderNumber: 'PO-2026-0002',
    status: 'QUEUED',
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Emirates Pottery Co.',
        },
      },
      items: [
        {
          description: 'Custom Planter Set',
          quantity: 200,
          unitPrice: 52,
          totalPrice: 10400,
        },
      ],
      total: 11232,
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    priority: 'HIGH',
  },
  {
    id: 'prod-003',
    orderNumber: 'PO-2026-0003',
    status: 'QUEUED',
    quotation: {
      rfp: {
        vendorProfile: {
          companyName: 'Dubai Art Studios',
        },
      },
      items: [
        {
          description: 'Premium Hand-Painted Pottery',
          quantity: 75,
          unitPrice: 95,
          totalPrice: 7125,
        },
      ],
      total: 7695,
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    priority: 'URGENT',
  },
];

export default function ProductionQueuePage() {
  const router = useRouter();
  const [queue, setQueue] = useState(DUMMY_QUEUE);
  const [isLoading, setIsLoading] = useState(false);

  const totalValue = queue.reduce((sum, order) => sum + order.quotation.total, 0);
  const avgWaitTime = queue.length
    ? Math.round(
        queue.reduce((sum, order) => {
          return sum + (new Date().getTime() - order.createdAt.getTime());
        }, 0) /
          queue.length /
          (24 * 60 * 60 * 1000)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Production Queue</h1>
          <p className="text-gray-600 mt-2">Review and approve orders for production</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{queue.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">AED {totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{avgWaitTime} days</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Priority Orders</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {queue.filter((o) => o.priority === 'URGENT').length}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Queue List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : queue.length > 0 ? (
          <div className="space-y-4">
            {queue.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Left: Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.priority === 'URGENT'
                              ? 'bg-red-100 text-red-800'
                              : order.priority === 'HIGH'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-gray-600">{order.quotation.rfp.vendorProfile.companyName}</p>
                    </div>

                    {/* Middle: Details */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">AED {order.quotation.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.quotation.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.quotation.items.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {item.description} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Submitted {Math.round((new Date().getTime() - order.createdAt.getTime()) / (24 * 60 * 60 * 1000))} days ago
                    </p>
                    <button
                      onClick={() => router.push(`/manager/production-queue/${order.id}/approve`)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                      Review & Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-semibold">No Pending Orders</p>
            <p className="text-gray-500 text-sm mt-2">All orders have been approved and sent to production</p>
          </div>
        )}
      </div>
    </div>
  );
}
