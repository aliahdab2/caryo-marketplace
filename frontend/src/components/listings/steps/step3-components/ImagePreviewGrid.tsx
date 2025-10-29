"use client";

import React, { memo } from 'react';
import Image from 'next/image';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { ListingFormData } from '@/types/listings';

interface ImagePreviewGridProps {
  formData: ListingFormData;
  imagePreviewUrls: string[];
  draggedImageIndex: number | null;
  dragOverImageIndex: number | null;
  removeImage: (index: number) => void;
  handleImageDragStart: (e: React.DragEvent, index: number) => void;
  handleImageDragOver: (e: React.DragEvent, index: number) => void;
  handleImageDragLeave: () => void;
  handleImageDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleImageDragEnd: () => void;
}

const ImagePreviewGrid = memo(function ImagePreviewGrid({
  formData,
  imagePreviewUrls,
  draggedImageIndex,
  dragOverImageIndex,
  removeImage,
  handleImageDragStart,
  handleImageDragOver,
  handleImageDragLeave,
  handleImageDrop,
  handleImageDragEnd
}: ImagePreviewGridProps) {
  const { t } = useLazyTranslation(['listings']);

  if (formData.images.length === 0 && imagePreviewUrls.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('listings:newListingImagePreview', 'Image Preview')} ({imagePreviewUrls.length})
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('listings:reorderImagesHint', 'Drag images to reorder • First image is your main photo')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {imagePreviewUrls.length}/10 images
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {imagePreviewUrls.map((url: string, index: number) => (
          <div
            key={`${url}-${index}`}
            className={`relative group cursor-move transition-all duration-300 ${
              draggedImageIndex === index
                ? 'scale-105 rotate-2 opacity-75 z-10'
                : dragOverImageIndex === index
                ? 'scale-105 ring-4 ring-blue-300 dark:ring-blue-600'
                : 'hover:scale-[1.02]'
            }`}
            draggable
            onDragStart={(e) => handleImageDragStart(e, index)}
            onDragOver={(e) => handleImageDragOver(e, index)}
            onDragLeave={handleImageDragLeave}
            onDrop={(e) => handleImageDrop(e, index)}
            onDragEnd={handleImageDragEnd}
          >
            {/* Image Container */}
            <div className={`aspect-square rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 relative border-2 transition-all duration-300 ${
              index === 0
                ? 'border-blue-400 dark:border-blue-500 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 group-hover:border-gray-300 dark:group-hover:border-gray-500'
            }`}>
              <Image
                src={url}
                alt={`Car listing image ${index + 1} - uploaded preview for ${formData.title || 'new listing'}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                draggable={false}
                priority={index === 0} // Prioritize main image
              />

              {/* Drag Handle Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 backdrop-blur-sm">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Remove Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage(index);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110"
              aria-label={`Remove image ${index + 1}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Enhanced Main Photo Badge */}
            {index === 0 && (
              <div className="absolute bottom-2 start-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium">{t('listings:newListingMainImage', 'Main Photo')}</span>
              </div>
            )}

            {/* Image Number Badge */}
            <div className="absolute top-2 start-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {index + 1}
            </div>

            {/* File Info on Hover */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {formData.images[index] && (formData.images[index].size / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reordering Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            💡 {t('listings:howToReorderTitle', 'How to reorder your photos')}
          </h5>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {t('listings:howToReorderBody', 'Drag and drop images to change their order. The first image will be your main listing photo that buyers see first.')}
          </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ImagePreviewGrid;
