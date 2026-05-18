/**
 * QuotationCard - Display quotation as a list item
 * Used in quotation lists and dashboards
 */

'use client';

import { Quotation } from '@prisma/client';
import { Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface QuotationCardProps {
  quotation: any; // Quotation with relations
  href: string;
  onView?: () => void;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
  SENT: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Clock },
  VIEWED: { label: 'Viewed', color: 'bg-blue-100 text-blue-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REVISION_REQUESTED: { label: 'Revision', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function QuotationCard({ quotation, href, onView }: QuotationCardProps) {
  const status = STATUS_CONFIG[quotation.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  return (
    <Link href={href}>
      <div
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
        onClick={onView}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Company & RFP Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {quotation.rfp?.vendorProfile?.companyName || 'Unknown Vendor'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              RFP: {quotation.rfp?.rfpNumber}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {quotation.items?.length || 0} items
            </p>
          </div>

          {/* Middle: Amount */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-gray-900 font-semibold">
              <DollarSign className="w-4 h-4" />
              {quotation.total?.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Valid until {new Date(quotation.validUntil).toLocaleDateString()}
            </p>
          </div>

          {/* Right: Status */}
          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              {status.label}
            </div>
          </div>
        </div>

        {/* Footer: Dates */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Created: {new Date(quotation.createdAt).toLocaleDateString()}</span>
          {quotation.sentAt && <span>Sent: {new Date(quotation.sentAt).toLocaleDateString()}</span>}
          {quotation.respondedAt && <span>Responded: {new Date(quotation.respondedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </Link>
  );
}
