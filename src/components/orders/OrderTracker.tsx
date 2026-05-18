/**
 * OrderTracker - Visual timeline showing order progress for vendors
 * Real-time status updates as production progresses
 */

'use client';

import { CheckCircle, Clock, Zap } from 'lucide-react';

interface OrderTrackerProps {
  orderNumber: string;
  currentStage: string;
  estimatedCompletion: Date;
  status: string;
  productionNotes?: string;
}

const STAGES = [
  {
    id: 'PENDING',
    label: 'Awaiting Production',
    description: 'Your order is in our queue',
  },
  {
    id: 'MOLDING',
    label: 'Molding',
    description: 'Creating the pot shape',
  },
  {
    id: 'DRYING',
    label: 'Drying',
    description: 'Curing and drying phase',
  },
  {
    id: 'FINISHING',
    label: 'Finishing',
    description: 'Surface finishing',
  },
  {
    id: 'GLAZING',
    label: 'Glazing',
    description: 'Color and glaze application',
  },
  {
    id: 'QUALITY_CHECK',
    label: 'Quality Check',
    description: 'Inspection and QC',
  },
  {
    id: 'PACKAGING',
    label: 'Packaging',
    description: 'Preparing for shipment',
  },
  {
    id: 'READY',
    label: 'Ready',
    description: 'Complete and ready for delivery',
  },
];

export default function OrderTracker({
  orderNumber,
  currentStage,
  estimatedCompletion,
  status,
  productionNotes,
}: OrderTrackerProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);
  const completedCount = currentIndex + 1;
  const progressPercent = (completedCount / STAGES.length) * 100;

  const daysRemaining = Math.ceil(
    (estimatedCompletion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysRemaining < 0;
  const isCompleted = currentStage === 'READY';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Order Status</h2>
        <p className="text-gray-600 mt-1">{orderNumber}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-gray-700">Overall Progress</p>
          <p className="text-sm font-bold text-blue-600">{Math.round(progressPercent)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8 space-y-0">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <div key={stage.id} className="flex gap-4 pb-6">
              {/* Timeline Dot & Line */}
              <div className="relative flex flex-col items-center">
                {/* Dot */}
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                    isCompleted
                      ? 'bg-green-600 border-green-600'
                      : isCurrent
                        ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-200'
                        : 'bg-gray-200 border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : isCurrent ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  )}
                </div>

                {/* Vertical Line */}
                {idx < STAGES.length - 1 && (
                  <div
                    className={`w-1 h-20 mt-2 transition-all ${
                      isCompleted || isCurrent ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1.5">
                <div className={`${isCurrent ? 'bg-blue-50 border border-blue-200 rounded-lg p-3' : ''}`}>
                  <h3
                    className={`font-semibold text-lg transition-colors ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {stage.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{stage.description}</p>

                  {isCurrent && productionNotes && (
                    <div className="mt-3 p-3 bg-white border border-blue-300 rounded text-sm text-blue-900">
                      <p className="font-semibold mb-1">Production Note:</p>
                      <p>{productionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        {/* Current Stage */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Current Stage</p>
          <p className="text-xl font-bold text-blue-600">
            {STAGES[currentIndex]?.label || currentStage}
          </p>
        </div>

        {/* Timeline */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Est. Completion</p>
          <p className="text-lg font-bold text-gray-900">
            {estimatedCompletion.toLocaleDateString()}
          </p>
        </div>

        {/* Days Remaining */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Days Remaining</p>
          <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
            {isCompleted ? 'Completed ✓' : isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
          </p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-bold text-green-900">Order Complete!</p>
                <p className="text-sm text-green-700">Your order is ready for delivery</p>
              </div>
            </>
          ) : (
            <>
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-bold text-blue-900">In Production</p>
                <p className="text-sm text-blue-700">Currently at: {STAGES[currentIndex]?.label}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Questions?</span> Contact us at support@forestry.com or call +971-50-XXX-XXXX
        </p>
      </div>
    </div>
  );
}
