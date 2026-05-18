/**
 * JobCard - Production job list item
 * Shows order summary, vendor info, and current status
 */

'use client';

import { ProductionOrder } from '@prisma/client';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface JobCardProps {
  job: any; // ProductionOrder with relations
  href: string;
}

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

const STAGE_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-gray-200', progress: 12.5 },
  MOLDING: { label: 'Molding', color: 'bg-blue-400', progress: 25 },
  DRYING: { label: 'Drying', color: 'bg-blue-500', progress: 37.5 },
  FINISHING: { label: 'Finishing', color: 'bg-purple-400', progress: 50 },
  GLAZING: { label: 'Glazing', color: 'bg-purple-500', progress: 62.5 },
  QUALITY_CHECK: { label: 'QC', color: 'bg-green-400', progress: 75 },
  PACKAGING: { label: 'Packaging', color: 'bg-green-500', progress: 87.5 },
  READY: { label: 'Ready', color: 'bg-green-600', progress: 100 },
};

export default function JobCard({ job, href }: JobCardProps) {
  const priorityConfig = PRIORITY_CONFIG[job.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.NORMAL;
  const stageConfig = STAGE_CONFIG[job.currentStage as keyof typeof STAGE_CONFIG] || STAGE_CONFIG.PENDING;
  const isOverdue = job.estimatedCompletion && new Date(job.estimatedCompletion) < new Date();

  return (
    <Link href={href}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
        {/* Header: Order Number & Vendor */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{job.orderNumber}</h3>
            <p className="text-sm text-gray-600">
              {job.quotation?.rfp?.vendorProfile?.companyName}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
        </div>

        {/* Current Stage & Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Current Stage</span>
            <span className={`text-sm font-bold px-2 py-1 rounded ${stageConfig.color} text-white`}>
              {stageConfig.label}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${stageConfig.color}`}
              style={{ width: `${stageConfig.progress}%` }}
            />
          </div>
        </div>

        {/* Details Row */}
        <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-gray-100">
          {/* Quantity */}
          <div>
            <p className="text-xs text-gray-500">Items</p>
            <p className="font-semibold text-gray-900">
              {job.quotation?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs text-gray-500">Est. Completion</p>
            <p className="font-semibold text-gray-900 text-sm">
              {job.estimatedCompletion ? new Date(job.estimatedCompletion).toLocaleDateString() : 'TBD'}
            </p>
          </div>

          {/* Days Left */}
          <div>
            <p className="text-xs text-gray-500">Days Left</p>
            {job.estimatedCompletion ? (
              <p
                className={`font-semibold text-sm ${
                  isOverdue ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {Math.ceil(
                  (new Date(job.estimatedCompletion).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </p>
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-2 mt-3">
          {isOverdue && job.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <AlertCircle className="w-3 h-3" />
              Overdue
            </div>
          )}
          {job.status === 'COMPLETED' && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              Completed
            </div>
          )}
          {job.status === 'APPROVED' && (
            <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Clock className="w-3 h-3" />
              Approved
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
