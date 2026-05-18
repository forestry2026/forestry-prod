'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropUploadProps {
  onImageUrl: (url: string) => void;
  onClose: () => void;
}

type DragMode = null | 'move' | 'resize-ne' | 'resize-nw' | 'resize-se' | 'resize-sw';

export default function ImageCropUpload({ onImageUrl, onClose }: ImageCropUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setZoom(1);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setPreview(src);

      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        const size = Math.min(img.width, img.height);
        const cropSize = Math.min(size * 0.6, 250);
        setCropBox({
          x: (size - cropSize) / 2,
          y: (size - cropSize) / 2,
          width: cropSize,
          height: cropSize,
        });

        // Calculate minimum zoom to fit image in container (450px height)
        const containerHeight = 450;
        const minZoomValue = Math.min(containerHeight / img.height, 1);
        setMinZoom(minZoomValue);
        setZoom(minZoomValue);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!dragMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setCropBox((prev) => {
        let newBox = { ...prev };

        if (dragMode === 'move') {
          newBox.x = Math.max(0, Math.min(prev.x + deltaX, imageSize.width - prev.width));
          newBox.y = Math.max(0, Math.min(prev.y + deltaY, imageSize.height - prev.height));
        } else {
          const minSize = 50;
          const maxSize = Math.min(imageSize.width, imageSize.height);

          if (dragMode === 'resize-se') {
            const newWidth = Math.min(maxSize - prev.x, Math.max(minSize, prev.width + deltaX));
            newBox.width = newWidth;
            newBox.height = newWidth;
          } else if (dragMode === 'resize-sw') {
            const newWidth = Math.max(minSize, prev.width - deltaX);
            newBox.x = Math.max(0, prev.x + deltaX);
            newBox.width = newWidth;
            newBox.height = newWidth;
          } else if (dragMode === 'resize-ne') {
            newBox.y = Math.max(0, prev.y + deltaY);
            const newHeight = Math.max(minSize, prev.height - deltaY);
            newBox.width = newHeight;
            newBox.height = newHeight;
          } else if (dragMode === 'resize-nw') {
            const newWidth = Math.max(minSize, prev.width - deltaX);
            newBox.x = Math.max(0, prev.x + deltaX);
            newBox.y = Math.max(0, prev.y + deltaY);
            newBox.width = newWidth;
            newBox.height = newWidth;
          }

          if (newBox.x + newBox.width > imageSize.width) {
            newBox.width = imageSize.width - newBox.x;
          }
          if (newBox.y + newBox.height > imageSize.height) {
            newBox.height = imageSize.height - newBox.y;
          }
        }

        return newBox;
      });

      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setDragMode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, dragStart, imageSize]);

  // Update preview canvas in real-time
  useEffect(() => {
    if (!previewCanvasRef.current || !imgRef.current || !preview) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    ctx.drawImage(
      imgRef.current,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      200,
      200
    );
  }, [cropBox, preview]);

  const cropAndUpload = async () => {
    if (!preview || !canvasRef.current || !imgRef.current) {
      setError('Missing image data');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = cropBox.width;
      canvas.height = cropBox.height;

      ctx.drawImage(
        imgRef.current,
        cropBox.x,
        cropBox.y,
        cropBox.width,
        cropBox.height,
        0,
        0,
        cropBox.width,
        cropBox.height
      );

      const croppedImage = canvas.toDataURL('image/png');

      if (!croppedImage) {
        throw new Error('Failed to create cropped image');
      }

      const formData = new FormData();
      formData.append('croppedImage', croppedImage);

      const res = await fetch('/api/attributes/textures/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const data = await res.json();

      if (!data.imageUrl) {
        throw new Error('No image URL returned from server');
      }

      onImageUrl(data.imageUrl);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((prev) => {
      const newZoom = direction === 'in' ? Math.min(prev + 0.2, 3) : Math.max(prev - 0.2, minZoom);
      return parseFloat(newZoom.toFixed(1));
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gray-100 border-b border-gray-200 flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-charcoal">Upload & Crop Texture</h2>
            <p className="text-charcoal/60 text-sm mt-1">Square crops work best for textures</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-charcoal" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {!preview ? (
            <label className="block cursor-pointer h-full flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-3 border-dashed border-terracotta rounded-2xl p-16 text-center hover:bg-terracotta/5 transition-colors w-full">
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-terracotta" />
                  <div>
                    <p className="font-bold text-charcoal text-xl">Click to upload or drag and drop</p>
                    <p className="text-charcoal/60 text-sm mt-2">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-8 h-full">
              {/* Main crop area */}
              <div className="col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal">Adjust Your Crop</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleZoom('out')}
                      disabled={zoom <= minZoom}
                      className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
                      title="Zoom out"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-charcoal min-w-20 text-center">
                      {Math.round(zoom * 100)}%
                    </div>
                    <button
                      onClick={() => handleZoom('in')}
                      disabled={zoom >= 3}
                      className="p-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-lg transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setZoom(minZoom)}
                      disabled={zoom === minZoom}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-charcoal text-xs font-semibold rounded-lg transition-colors"
                      title="Fit entire image in view"
                    >
                      Fit
                    </button>
                  </div>
                </div>

                <div className="relative bg-gray-50 rounded-xl overflow-hidden border border-gray-300" style={{ height: '450px' }}>
                  {/* Image container */}
                  <div
                    ref={containerRef}
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      backgroundColor: '#f3f4f6',
                      overflow: zoom > minZoom ? 'auto' : 'hidden',
                    }}
                  >
                    <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                      <img
                        ref={imgRef}
                        src={preview}
                        alt="Preview"
                        className="block"
                        style={{
                          display: 'block',
                          maxWidth: '600px',
                          height: 'auto',
                        }}
                      />

                      {/* Darkened areas */}
                      <div
                        className="absolute bg-black/40 pointer-events-none"
                        style={{
                          top: 0,
                          left: 0,
                          right: 0,
                          height: `${(cropBox.y / imageSize.height) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute bg-black/40 pointer-events-none"
                        style={{
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${((imageSize.height - cropBox.y - cropBox.height) / imageSize.height) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute bg-black/40 pointer-events-none"
                        style={{
                          top: `${(cropBox.y / imageSize.height) * 100}%`,
                          left: 0,
                          height: `${(cropBox.height / imageSize.height) * 100}%`,
                          width: `${(cropBox.x / imageSize.width) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute bg-black/40 pointer-events-none"
                        style={{
                          top: `${(cropBox.y / imageSize.height) * 100}%`,
                          right: 0,
                          height: `${(cropBox.height / imageSize.height) * 100}%`,
                          width: `${((imageSize.width - cropBox.x - cropBox.width) / imageSize.width) * 100}%`,
                        }}
                      />

                      {/* Crop box */}
                      <div
                        className="absolute border-3 border-terracotta bg-terracotta/5 cursor-move group"
                        style={{
                          left: `${(cropBox.x / imageSize.width) * 100}%`,
                          top: `${(cropBox.y / imageSize.height) * 100}%`,
                          width: `${(cropBox.width / imageSize.width) * 100}%`,
                          height: `${(cropBox.height / imageSize.height) * 100}%`,
                        }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).className.includes('resize')) return;
                          handleMouseDown(e, 'move');
                        }}
                      >
                        {/* Corners */}
                        <div
                          className="absolute w-6 h-6 bg-terracotta rounded-full cursor-nwse-resize -left-3 -top-3 border-3 border-white shadow-lg hover:scale-125 transition-transform"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-nw')}
                        />
                        <div
                          className="absolute w-6 h-6 bg-terracotta rounded-full cursor-nesw-resize -right-3 -top-3 border-3 border-white shadow-lg hover:scale-125 transition-transform"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-ne')}
                        />
                        <div
                          className="absolute w-6 h-6 bg-terracotta rounded-full cursor-nesw-resize -left-3 -bottom-3 border-3 border-white shadow-lg hover:scale-125 transition-transform"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-sw')}
                        />
                        <div
                          className="absolute w-6 h-6 bg-terracotta rounded-full cursor-nwse-resize -right-3 -bottom-3 border-3 border-white shadow-lg hover:scale-125 transition-transform"
                          onMouseDown={(e) => handleMouseDown(e, 'resize-se')}
                        />

                        {/* Instructions */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                            Drag to move • Pull corners to resize
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview panel */}
              <div className="space-y-4">
                <h3 className="font-semibold text-charcoal">Live Preview</h3>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 aspect-square flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full rounded-lg border-2 border-gray-300 bg-white"
                  />
                </div>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-semibold text-charcoal/60 uppercase">Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-charcoal/70">Size</span>
                      <span className="font-semibold text-charcoal">{Math.round(cropBox.width)}×{Math.round(cropBox.height)} px</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-charcoal/70">Position</span>
                      <span className="font-semibold text-charcoal">{Math.round(cropBox.x)}, {Math.round(cropBox.y)}</span>
                    </div>
                    <div className="h-px bg-gray-300 my-2" />
                    <p className="text-xs text-charcoal/60 italic">✓ Square aspect ratio locked</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="border-t border-gray-200 bg-gray-50 p-6 flex gap-3">
            <button
              onClick={() => {
                setPreview(null);
                setSelectedFile(null);
                setError(null);
                setZoom(1);
              }}
              className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-charcoal font-semibold py-3 rounded-lg transition-colors"
            >
              Change Image
            </button>
            <button
              onClick={cropAndUpload}
              disabled={uploading}
              className="flex-1 bg-terracotta hover:bg-terracotta-dark disabled:bg-terracotta/50 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
