"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import { useLanguageDirection } from '@/utils/languageDirection';
import type { HoverImageNavigationProps } from '@/types/media';

/**
 * AutoTrader.co.uk style hover image navigation component
 * Shows navigation arrows on hover to cycle through multiple images
 */
const HoverImageNavigation: React.FC<HoverImageNavigationProps> = ({
  media = [],
  alt,
  className = "",
  imageClassName = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  onImageError
}) => {
  const { isRTL } = useLanguageDirection();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Memoize processed media to avoid recalculation on every render
  const processedMedia = useMemo(() => {
    if (!media || !Array.isArray(media)) return [];
    
    return media
      .filter(item => item && item.url && typeof item.url === 'string')
      .map(item => ({
        ...item,
        isVideo: item.type === 'video' || item.contentType?.toLowerCase().includes('video')
      }));
  }, [media]);

  const hasMultipleImages = processedMedia.length > 1;
  const currentMedia = processedMedia[currentIndex] || null;

  // Reset currentIndex when media changes
  useEffect(() => {
    if (currentIndex >= processedMedia.length && processedMedia.length > 0) {
      setCurrentIndex(0);
    }
  }, [processedMedia.length, currentIndex]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => 
      prev === processedMedia.length - 1 ? 0 : prev + 1
    );
  }, [processedMedia.length]);

  const goToPrevious = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => 
      prev === 0 ? processedMedia.length - 1 : prev - 1
    );
  }, [processedMedia.length]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onImageError) {
      onImageError(e);
    } else {
      e.currentTarget.src = getDefaultImageUrl();
    }
  }, [onImageError]);

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Image */}
      <Image
        src={currentMedia ? transformMinioUrl(currentMedia.url) : getDefaultImageUrl()}
        alt={alt}
        fill
        className={`object-cover transition-transform duration-500 ease-in-out group-hover:scale-110 ${imageClassName}`}
        sizes={sizes}
        priority={priority}
        unoptimized
        onError={handleImageError}
      />

      {/* Video Play Icon Overlay */}
      {currentMedia?.isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
            <Play className="w-6 h-6 text-gray-800" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Previous Button - Only show if multiple images, on hover, and not on first image */}
      {hasMultipleImages && isHovered && currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className={`absolute top-1/2 -translate-y-1/2 z-20 p-1.5 bg-gradient-to-br from-black/30 via-slate-800/40 to-black/30 backdrop-blur-sm text-white font-semibold shadow-md border border-white/20 rounded-full transition-all duration-300 ease-out transform-gpu opacity-0 group-hover:opacity-100 hover:scale-105 hover:bg-gradient-to-br hover:from-black/60 hover:via-slate-800/70 hover:to-black/60 ${
            isRTL ? 'right-1.5' : 'left-1.5'
          }`}
          aria-label="Previous image"
        >
          {isRTL ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Next Button - Only show if multiple images and on hover */}
      {hasMultipleImages && isHovered && (
        <button
          onClick={goToNext}
          className={`absolute top-1/2 -translate-y-1/2 z-20 p-1.5 bg-gradient-to-br from-black/30 via-slate-800/40 to-black/30 backdrop-blur-sm text-white font-semibold shadow-md border border-white/20 rounded-full transition-all duration-300 ease-out transform-gpu opacity-0 group-hover:opacity-100 hover:scale-105 hover:bg-gradient-to-br hover:from-black/60 hover:via-slate-800/70 hover:to-black/60 ${
            isRTL ? 'left-1.5' : 'right-1.5'
          }`}
          aria-label="Next image"
        >
          {isRTL ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Dot Indicators - Only show if multiple images and on hover */}
      {hasMultipleImages && isHovered && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black bg-opacity-50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {processedMedia.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white bg-opacity-60 hover:bg-opacity-80'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HoverImageNavigation;
