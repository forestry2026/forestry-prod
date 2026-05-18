/**
 * Admin Quotations List Page
 * View all quotations, filter by status, send to vendors
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QuotationCard from '@/components/quotations/QuotationCard';
import { Filter, Plus, Loader } from 'lucide-react';

const DUMMY_QUOTATIONS = [
  {
    id: 'quot-001',
    status: 'SENT',
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
        description: 'Large Terracotta Pot',
        quantity: 100,
        unitPrice: 45,
        totalPrice: 4500,
      },
      {
        id: 'item-002',
        description: 'Medium Decorative Pot',
        quantity: 150,
        unitPrice: 35,
        totalPrice: 5250,
      },
    ],
    subtotal: 9750,
    tax: 780,
    total: 10530,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    respondedAt: null,
  },
  {
    id: 'quot-002',
    status: 'APPROVED',
    rfp: {
      rfpNumber: 'RFP-2026-0002',
      vendorProfile: {
        id: 'vendor-002',
        companyName: 'Emirates Pottery Co.',
        user: {
          email: 'sales@emiratespottery.ae',
        },
      },
    },
    items: [
      {
        id: 'item-003',
        description: 'Custom Planter Set',
        quantity: 200,
        unitPrice: 52,
        totalPrice: 10400,
      },
    ],
    subtotal: 10400,
    tax: 832,
    total: 11232,
    validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'quot-003',
    status: 'DRAFT',
    rfp: {
      rfpNumber: 'RFP-2026-0003',
      vendorProfile: {
        id: 'vendor-003',
        companyName: 'Dubai Art Studios',
        user: {
          email: 'inquiry@dubaiart.ae',
        },
      },
    },
    items: [
      {
        id: 'item-004',
        description: 'Premium Hand-Painted Pottery',
        quantity: 75,
        unitPrice: 95,
        totalPrice: 7125,
      },
    ],
    subtotal: 7125,
    tax: 570,
    total: 7695,
    validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    sentAt: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    respondedAt: null,
  },
  {
    id: 'quot-004',
    status: 'REVISION_REQUESTED',
    rfp: {
      rfpNumber: 'RFP-2026-0004',
      vendorProfile: {
        id: 'vendor-004',
        companyName: 'Al Ain Ceramics',
        user: {
          email: 'orders@alainceramics.ae',
        },
      },
    },
    items: [
      {
        id: 'item-005',
        description: 'Bulk Terracotta',
        quantity: 500,
        unitPrice: 25,
        totalPrice: 12500,
      },
    ],
    subtotal: 12500,
    tax: 1000,
    total: 13500,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

export default function QuotationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quotations, setQuotations] = useState(DUMMY_QUOTATIONS);
  const [filteredQuotations, setFilteredQuotations] = useState(DUMMY_QUOTATIONS);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredQuotations(quotations);
    } else {
      setFilteredQuotations(quotations.filter((q) => q.status === statusFilter));
    }
  }, [statusFilter, quotations]);

  const statusCounts = {
    ALL: quotations.length,
    DRAFT: quotations.filter((q) => q.status === 'DRAFT').length,
    SENT: quotations.filter((q) => q.status === 'SENT').length,
    APPROVED: quotations.filter((q) => q.status === 'APPROVED').length,
    REVISION_REQUESTED: quotations.filter((q) => q.status === 'REVISION_REQUESTED').length,
  };

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-charcoal mb-2">Dashboard</h1>
      <p className="text-charcoal/70 mb-8">Overview of your order lifecycle management</p>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white rounded-lg border border-cream-darker p-6 shadow-card">
          <div className="text-sm text-charcoal/60 font-semibold mb-2">Total Quotations</div>
          <div className="text-3xl font-bold text-terracotta">{quotations.length}</div>
          <div className="text-xs text-charcoal/50 mt-3">{statusCounts.APPROVED} approved</div>
        </div>

        <div className="bg-white rounded-lg border border-cream-darker p-6 shadow-card">
          <div className="text-sm text-charcoal/60 font-semibold mb-2">Pending Response</div>
          <div className="text-3xl font-bold text-orange-600">{statusCounts.SENT}</div>
          <div className="text-xs text-charcoal/50 mt-3">Awaiting vendor response</div>
        </div>

        <div className="bg-white rounded-lg border border-cream-darker p-6 shadow-card">
          <div className="text-sm text-charcoal/60 font-semibold mb-2">Drafts</div>
          <div className="text-3xl font-bold text-charcoal">{statusCounts.DRAFT}</div>
          <div className="text-xs text-charcoal/50 mt-3">Not yet sent</div>
        </div>

        <div className="bg-white rounded-lg border border-cream-darker p-6 shadow-card">
          <div className="text-sm text-charcoal/60 font-semibold mb-2">Revisions</div>
          <div className="text-3xl font-bold text-sage">{statusCounts.REVISION_REQUESTED}</div>
          <div className="text-xs text-charcoal/50 mt-3">Awaiting update</div>
        </div>
      </div>

      {/* Quotations Section */}
      <h2 className="text-2xl font-heading font-bold text-charcoal mb-6">Quotations</h2>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => router.push('/quotations')}
          className="flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-warm-sm"
        >
          <Plus className="w-5 h-5" />
          Create Quotation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-cream-darker p-6 mb-8 shadow-card">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-terracotta" />
          <h2 className="font-semibold text-charcoal">Filter by Status</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {(['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REVISION_REQUESTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-terracotta text-white shadow-warm-sm'
                  : 'bg-cream-dark text-charcoal hover:bg-cream-darker border border-cream-darker'
              }`}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
              <span className="ml-2 text-sm font-normal opacity-75">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-terracotta animate-spin" />
        </div>
      ) : filteredQuotations.length > 0 ? (
        <div className="grid gap-4">
          {filteredQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.id}
              quotation={quotation}
              href={`/quotations/${quotation.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-cream-darker p-12 text-center shadow-card">
          <p className="text-charcoal/60 text-lg">No quotations found</p>
        </div>
      )}
    </div>
  );
}
