'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export function ProductDeleteButton({ productId, productName }: ProductDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setIsOpen(false);
      // Refresh the page after successful deletion
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isDeleting}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <DeleteConfirmDialog
        isOpen={isOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        itemName={productName}
        onConfirm={handleDelete}
        onCancel={() => setIsOpen(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
