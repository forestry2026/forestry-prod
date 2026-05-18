/**
 * Vendor Order Details Page
 * Full order view with real-time production tracker
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderTracker from '@/components/orders/OrderTracker';
import { ArrowLeft, FileText, Zap } from 'lucide-react';

// Dummy data
const DUMMY_ORDER = {
  id: 'prod-001',
  orderNumber: 'PO-2026-0001',
  status: 'IN_PROGRESS',
  currentStage: 'DRYING',
  estimatedCompletion: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
  productionNotes: 'Drying process ongoing. Items will move to finishing stage in 2-3 days.',
  quotation: {
    rfp: {
      rfpNumber: 'RFP-2026-0001',
      projectName: 'Al Jazeera Summer Collection',
    },
    items: [
      {
        id: 'item-001',
        description: 'Large Terracotta Pot - Premium Grade',
        specifications:
          '{"size": "Large (24\\" height)", "color": "Terracotta", "texture": "Smooth", "finish": "Matte"}',
        quantity: 100,
        unitPrice: 45,
        totalPrice: 4500,
      },
      {
        id: 'item-002',
        description: 'Medium Decorative Pot - Hand-Painted',
        specifications:
          '{"size": "Medium (16\\" height)", "color": "Custom Blue", "texture": "Hammered", "finish": "Glossy"}',
        quantity: 150,
        unitPrice: 35,
        totalPrice: 5250,
      },
    ],
    subtotal: 9750,
    tax: 780,
    total: 10530,
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
  },
};

export default function VendorOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order] = useState(DUMMY_ORDER);

  const totalQuantity = order.quotation.items.reduce((sum, item) => sum + item.quantity, 0);

  // Dummy image URL
  const dummyImageUrl = `https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=600&h=600&fit=crop`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">{order.quotation.rfp.projectName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{totalQuantity}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">AED {order.quotation.total.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-lg font-bold text-gray-900">AED {order.quotation.subtotal.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Tax (5%)</p>
                  <p className="text-lg font-bold text-gray-900">AED {order.quotation.tax.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Product Images & Items */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Items Details</h2>
              <div className="space-y-6">
                {order.quotation.items.map((item, idx) => {
                  const specs = JSON.parse(item.specifications || '{}');
                  return (
                    <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Image */}
                        <div className="md:w-1/3 bg-gray-50 flex items-center justify-center min-h-48">
                          <img
                            src={dummyImageUrl}
                            alt={item.description}
                            className="w-full h-48 object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 p-4">
                          <h3 className="font-bold text-gray-900 mb-4">{item.description}</h3>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-gray-600">Quantity</p>
                              <p className="font-semibold text-gray-900">{item.quantity} units</p>
                            </div>
                            {specs.size && (
                              <div>
                                <p className="text-xs text-gray-600">Size</p>
                                <p className="font-semibold text-gray-900">{specs.size}</p>
                              </div>
                            )}
                            {specs.color && (
                              <div>
                                <p className="text-xs text-gray-600">Color</p>
                                <p className="font-semibold text-gray-900">{specs.color}</p>
                              </div>
                            )}
                            {specs.texture && (
                              <div>
                                <p className="text-xs text-gray-600">Texture</p>
                                <p className="font-semibold text-gray-900">{specs.texture}</p>
                              </div>
                            )}
                            {specs.finish && (
                              <div>
                                <p className="text-xs text-gray-600">Finish</p>
                                <p className="font-semibold text-gray-900">{specs.finish}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600">Unit Price</p>
                              <p className="font-semibold text-gray-900">AED {item.unitPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Total</p>
                              <p className="font-bold text-green-600">AED {item.totalPrice.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Production Notes */}
            {order.productionNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Latest Production Update
                </h3>
                <p className="text-blue-800">{order.productionNotes}</p>
              </div>
            )}
          </div>

          {/* Right: Real-time Tracker */}
          <div className="lg:col-span-1">
            <OrderTracker
              orderNumber={order.orderNumber}
              currentStage={order.currentStage}
              estimatedCompletion={order.estimatedCompletion}
              status={order.status}
              productionNotes={order.productionNotes}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold text-gray-900 mb-2">RFP Number</p>
              <p className="text-gray-700">{order.quotation.rfp.rfpNumber}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Quotation Valid Until</p>
              <p className="text-gray-700">{order.quotation.validUntil.toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2">Order Approved</p>
              <p className="text-gray-700">{order.quotation.respondedAt?.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
