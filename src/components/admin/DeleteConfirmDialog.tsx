'use client';

import { useState } from 'react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ borderWidth: '0.5px', borderColor: '#e8dcc4' }}>
          {/* Header */}
          <div className="px-6 py-4" style={{ borderBottomWidth: '0.5px', borderColor: '#e8dcc4' }}>
            <h2 className="text-lg font-bold text-charcoal">{title}</h2>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-3">
            <p className="text-charcoal/80 text-sm">
              {message}
            </p>
            <div className="bg-red-50 rounded-lg px-4 py-3" style={{ borderWidth: '0.5px', borderColor: '#fecaca' }}>
              <p className="text-red-900 font-semibold text-sm">
                {itemName}
              </p>
            </div>
            <p className="text-charcoal/60 text-xs">
              This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTopWidth: '0.5px', borderColor: '#e8dcc4' }}>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg border border-cream-darker text-charcoal font-semibold hover:bg-cream/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
