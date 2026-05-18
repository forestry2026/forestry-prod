/**
 * Vendor Orders Page
 * View all their orders and track production status
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

// Dummy data
const DUMMY_ORDERS = [
  {
    id: 'prod-001',
    orderNumber: 'PO-2026-0001',
    status: 'IN_PROGRESS',
    currentStage: 'DRYING',
    estimatedCompletion: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    quotation: {
      total: 10530,
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'prod-002',
    orderNumber: 'PO-2026-0002',
    status: 'COMPLETED',
    currentStage: 'READY',
    estimatedCompletion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    quotation: {
      total: 5250,
    },
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'prod-003',
    orderNumber: 'PO-2026-0003',
    status: 'APPROVED',
    currentStage: 'PENDING',
    estimatedCompletion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    quotation: {
      total: 7695,
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders] = useState(DUMMY_ORDERS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading] = useState(false);

  const filteredOrders =
    statusFilter === 'ALL' ? orders : orders.filter((o) => o.status === statusFilter);

  const orderStats = {
    total: orders.length,
    inProgress: orders.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    pending: orders.filter((o) => o.status === 'APPROVED').length,
  };

  const totalValue = orders.reduce((sum, order) => sum + order.quotation.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Track your production orders and delivery status</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{orderStats.total}</p>
              </div>
              <Package className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Production</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{orderStats.inProgress}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{orderStats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">AED {totalValue.toLocaleString()}</p>
              </div>
              <Package className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <p className="font-semibold text-gray-900 mb-4">Filter by Status</p>
          <div className="flex gap-3 flex-wrap">
            {['ALL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const statusColor =
                order.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-800'
                  : order.status === 'IN_PROGRESS'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800';

              const daysRemaining = Math.ceil(
                (new Date(order.estimatedCompletion).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/vendor/orders/${order.id}`)}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {order.status === 'IN_PROGRESS' ? 'In Production' : order.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Created {Math.round((new Date().getTime() - order.createdAt.getTime()) / (24 * 60 * 60 * 1000))} days ago
                        </p>
                      </div>

                      {/* Middle: Current Stage & Timeline */}
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Current Stage</p>
                        <p className="text-lg font-bold text-gray-900">{order.currentStage.replace('_', ' ')}</p>
                      </div>

                      {/* Right: Timeline Info */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">AED {order.quotation.total.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.status === 'COMPLETED'
                            ? '✓ Completed'
                            : daysRemaining > 0
                              ? `${daysRemaining} days left`
                              : 'Overdue'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-700">Progress</p>
                        <p className="text-xs text-gray-600">
                          {order.status === 'COMPLETED'
                            ? '100%'
                            : order.currentStage === 'MOLDING'
                              ? '25%'
                              : order.currentStage === 'DRYING'
                                ? '37.5%'
                                : order.currentStage === 'FINISHING'
                                  ? '50%'
                                  : order.currentStage === 'GLAZING'
                                    ? '62.5%'
                                    : order.currentStage === 'QUALITY_CHECK'
                                      ? '75%'
                                      : order.currentStage === 'PACKAGING'
                                        ? '87.5%'
                                        : '12.5%'}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-600'
                              : 'bg-blue-600'
                          }`}
                          style={{
                            width:
                              order.status === 'COMPLETED'
                                ? '100%'
                                : order.currentStage === 'MOLDING'
                                  ? '25%'
                                  : order.currentStage === 'DRYING'
                                    ? '37.5%'
                                    : order.currentStage === 'FINISHING'
                                      ? '50%'
                                      : order.currentStage === 'GLAZING'
                                        ? '62.5%'
                                        : order.currentStage === 'QUALITY_CHECK'
                                          ? '75%'
                                          : order.currentStage === 'PACKAGING'
                                            ? '87.5%'
                                            : '12.5%',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
