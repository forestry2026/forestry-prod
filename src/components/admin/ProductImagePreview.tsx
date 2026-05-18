'use client';

import { useRef, useState } from 'react';

interface ProductImagePreviewProps {
  imageUrl: string;
  productName: string;
}

export function ProductImagePreview({ imageUrl, productName }: ProductImagePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition({
        left: rect.right + 15,
        top: rect.top + rect.height / 2 - 84,
      });
    }
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  return (
    <>
      <style>{`
        .image-preview-popup {
          position: fixed;
          width: 168px;
          height: 168px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
          overflow: hidden;
          z-index: 99999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .image-preview-popup.visible {
          opacity: 1;
          visibility: visible;
        }

        .image-preview-popup img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>

      <div
        ref={wrapperRef}
        className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={imageUrl}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>

      {showPreview && (
        <div
          className={`image-preview-popup visible`}
          style={{
            left: `${position.left}px`,
            top: `${position.top}px`,
          }}
        >
          <img src={imageUrl} alt={productName} />
        </div>
      )}
    </>
  );
}
