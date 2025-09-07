"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronLeft, Play } from 'lucide-react';
import { transformMinioUrl, getDefaultImageUrl, processVideoForGallery, isVideoMedia } from '@/utils/mediaUtils';
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
  onImageError,
  onVideoPlayingChange
}) => {
  const { isRTL } = useLanguageDirection();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Helper function to update video playing state and notify parent
  const updateVideoPlayingState = useCallback((playing: boolean) => {
    setIsVideoPlaying(playing);
    if (onVideoPlayingChange) {
      onVideoPlayingChange(playing);
    }
  }, [onVideoPlayingChange]);

  // Memoize processed media to avoid recalculation on every render
  const processedMedia = useMemo(() => {
    if (!media || !Array.isArray(media)) return [];

    return media
      .filter(item => item && item.url && typeof item.url === 'string')
      .map(item => {
        const isVideo = isVideoMedia(item);

        // Generate thumbnail URL for videos
        let displayUrl = item.url;
        let thumbnailUrl = item.url;

        if (isVideo) {
          const videoResult = processVideoForGallery(item.url);
          if (videoResult.thumbnailUrl) {
            displayUrl = videoResult.thumbnailUrl;
            thumbnailUrl = videoResult.thumbnailUrl;
          } else {
            // Fallback to placeholder for videos without thumbnails
            displayUrl = '/images/vehicles/placeholder.png';
            thumbnailUrl = '/images/vehicles/placeholder.png';
          }
        }

        return {
          ...item,
          isVideo,
          displayUrl,
          thumbnailUrl
        };
      });
  }, [media]);

  const hasMultipleImages = processedMedia.length > 1;
  const currentMedia = processedMedia[currentIndex] || null;

  // Reset currentIndex when media changes
  useEffect(() => {
    if (currentIndex >= processedMedia.length && processedMedia.length > 0) {
      setCurrentIndex(0);
    }
  }, [processedMedia.length, currentIndex]);

  // Keyboard support for closing video
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isVideoPlaying && e.key === 'Escape') {
        updateVideoPlayingState(false);
      }
    };

    if (isVideoPlaying) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVideoPlaying, updateVideoPlayingState]);


  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (onImageError) {
      onImageError(e);
    } else {
      e.currentTarget.src = getDefaultImageUrl();
    }
  }, [onImageError]);


  const handleVideoClose = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateVideoPlayingState(false);
  }, [updateVideoPlayingState]);

  const handleVideoPlay = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateVideoPlayingState(true);
  }, [updateVideoPlayingState]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateVideoPlayingState(false); // Stop video when navigating
    setCurrentIndex((prev) =>
      prev === processedMedia.length - 1 ? 0 : prev + 1
    );
  }, [updateVideoPlayingState, processedMedia.length]);

  const goToPrevious = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateVideoPlayingState(false); // Stop video when navigating
    setCurrentIndex((prev) =>
      prev === 0 ? processedMedia.length - 1 : prev - 1
    );
  }, [updateVideoPlayingState, processedMedia.length]);

  const renderVideoPlayer = useCallback((videoUrl: string) => {
    const { embedUrl, isYouTube } = processVideoForGallery(videoUrl);

    return (
      <div className="relative w-full h-full min-h-[200px] max-h-[400px] bg-black">
        {/* Close button positioned over video */}
        <button
          onClick={handleVideoClose}
          className="absolute top-2 right-2 z-50 w-8 h-8 bg-gray-800/80 hover:bg-gray-700/90 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200"
          aria-label="Close video and return to images"
          title="Click to return to images (or press ESC)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Video content - full area */}
        {isYouTube && embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
            title="Video content"
            className="absolute inset-0 w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="absolute inset-0 w-full h-full"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Show entire video, add black bars if needed
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        )}

        {/* Click anywhere except close button area to close */}
        <button
          onClick={handleVideoClose}
          className="absolute top-0 left-0 right-10 bottom-0 cursor-pointer bg-transparent border-none p-0 m-0"
          title="Click to close video"
          aria-label="Close video"
          type="button"
          tabIndex={0}
        />
      </div>
    );
  }, [handleVideoClose]);

  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Content - Either Image or Video */}
      {isVideoPlaying && currentMedia?.isVideo ? (
        renderVideoPlayer(currentMedia.url)
      ) : (
        <Image
          src={currentMedia ? transformMinioUrl(currentMedia.displayUrl || currentMedia.url) : getDefaultImageUrl()}
          alt={alt}
          fill
          className={`object-cover transition-transform duration-500 ease-in-out group-hover:scale-110 ${imageClassName}`}
          sizes={sizes}
          priority={priority}
          unoptimized
          onError={handleImageError}
        />
      )}

      {/* Video Play Icon Overlay - Only show when not playing */}
      {currentMedia?.isVideo && !isVideoPlaying && (
        <button
          onClick={handleVideoPlay}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-200 group/video"
          aria-label="Play video"
        >
          <div className="bg-white bg-opacity-90 rounded-full p-3 shadow-lg group-hover/video:scale-110 transition-transform duration-200">
            <Play className="w-6 h-6 text-gray-800" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Previous Button - Only show if multiple images, on hover, not on first image, and not playing video */}
      {hasMultipleImages && isHovered && currentIndex > 0 && !isVideoPlaying && (
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

      {/* Next Button - Only show if multiple images, on hover, and not playing video */}
      {hasMultipleImages && isHovered && !isVideoPlaying && (
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

      {/* Dot Indicators - Only show if multiple images, on hover, and not playing video */}
      {hasMultipleImages && isHovered && !isVideoPlaying && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black bg-opacity-50 rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {processedMedia.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateVideoPlayingState(false); // Stop video when navigating
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
