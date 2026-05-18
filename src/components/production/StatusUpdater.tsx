/**
 * StatusUpdater - Interface for production team to update job stage
 * Shows current stage and allows progression to next stage
 */

'use client';

import { useState } from 'react';
import { ChevronRight, Plus, AlertCircle } from 'lucide-react';

interface StatusUpdaterProps {
  currentStage: string;
  orderNumber: string;
  onUpdate: (toStage: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

const STAGES = ['PENDING', 'MOLDING', 'DRYING', 'FINISHING', 'GLAZING', 'QUALITY_CHECK', 'PACKAGING', 'READY'];

const STAGE_DESCRIPTIONS = {
  PENDING: 'Waiting to start',
  MOLDING: 'Creating the pot shape',
  DRYING: 'Curing/drying phase',
  FINISHING: 'Surface finishing',
  GLAZING: 'Color/glaze application',
  QUALITY_CHECK: 'QC inspection',
  PACKAGING: 'Preparing for shipment',
  READY: 'Complete, ready for delivery',
};

export default function StatusUpdater({
  currentStage,
  orderNumber,
  onUpdate,
  isLoading = false,
}: StatusUpdaterProps) {
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const currentIndex = STAGES.indexOf(currentStage);
  const nextStage = currentIndex < STAGES.length - 1 ? STAGES[currentIndex + 1] : null;
  const previousStage = currentIndex > 0 ? STAGES[currentIndex - 1] : null;

  const handleUpdate = async (toStage: string) => {
    try {
      await onUpdate(toStage, notes);
      setShowForm(false);
      setNotes('');
      setSelectedStage(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Production Status</h2>

      {/* Visual Timeline */}
      <div className="mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {STAGES.map((stage, idx) => {
            const isActive = stage === currentStage;
            const isCompleted = STAGES.indexOf(stage) < currentIndex;
            const isNext = stage === nextStage;

            return (
              <div key={stage} className="flex items-center gap-2 flex-shrink-0">
                {/* Stage Button */}
                <button
                  className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : isNext
                          ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                          : 'bg-gray-200 text-gray-600'
                  }`}
                  title={STAGE_DESCRIPTIONS[stage as keyof typeof STAGE_DESCRIPTIONS] || ''}
                >
                  {stage === 'QUALITY_CHECK' ? 'QC' : stage.substring(0, 3)}
                </button>

                {/* Divider */}
                {idx < STAGES.length - 1 && (
                  <ChevronRight className={`w-5 h-5 ${isCompleted || isActive ? 'text-green-600' : 'text-gray-400'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Stage Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Current Stage:</strong> {STAGE_DESCRIPTIONS[currentStage as keyof typeof STAGE_DESCRIPTIONS] || currentStage}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {!showForm ? (
        <div className="space-y-3">
          {nextStage && (
            <button
              onClick={() => {
                setSelectedStage(nextStage);
                setShowForm(true);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Move to {nextStage} Stage
            </button>
          )}

          {previousStage && (
            <button
              onClick={() => {
                setSelectedStage(previousStage);
                setShowForm(true);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Revert to {previousStage} (if needed)
            </button>
          )}

          {currentStage === 'READY' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✓ Order is complete and ready for delivery</p>
            </div>
          )}
        </div>
      ) : (
        /* Update Form */
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Move to: <span className="text-blue-600">{selectedStage}</span>
            </label>
            <div className="bg-white border border-gray-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                {STAGE_DESCRIPTIONS[selectedStage as keyof typeof STAGE_DESCRIPTIONS] || ''}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Production Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues, notes, or updates about this stage..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be visible to the vendor in their order tracking
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleUpdate(selectedStage!)}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'Updating...' : 'Confirm Update'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setNotes('');
                setSelectedStage(null);
              }}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Once updated, the vendor will be notified automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
