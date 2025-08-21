'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { CarMediaGalleryProps, CarMedia } from './types';

// Import components and icons
import { Dialog } from '@headlessui/react';
import { X, ChevronLeft, ChevronRight, Play, Camera, Video } from 'lucide-react';

// RTL support
import { useLanguageDirection } from '@/utils/languageDirection';

// Translation support
import { useTranslation } from 'react-i18next';

// Constants
const SWIPE_THRESHOLD = 50;
const THUMBNAIL_SIZES = "(max-width: 640px) 25vw, (max-width: 768px) 16vw, (max-width: 1024px) 12vw, 10vw";

// Types for internal state
interface SwipeState {
  start: number | null;
  end: number | null;
  isActive: boolean;
}

/**
 * Enhanced car media gallery component for Caryo Marketplace
 * Supports images and videos with optimized loading and responsive design
 * Features touch gestures, keyboard navigation, and accessibility support
 * with swipe navigation in both main view and modal
 */
const CarMediaGallery: React.FC<CarMediaGalleryProps> = ({
  media,
  initialIndex = 0,
  className = '',
}) => {
  // RTL support
  const { isRTL } = useLanguageDirection();
  
  // Translation support (using dedicated mediaGallery namespace as per translation guide)
  const { t } = useTranslation('mediaGallery');
  
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(initialIndex);
  const [selectedVideo, setSelectedVideo] = useState<CarMedia | null>(null);
  
  // Swipe state using custom state structure
  const [touchState, setTouchState] = useState<SwipeState>({ start: null, end: null, isActive: false });
  const [mouseState, setMouseState] = useState<SwipeState>({ start: null, end: null, isActive: false });
  
  // Refs for touch handling
  const mainGalleryRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Memoized computed values for performance
  const mediaStats = useMemo(() => {
    if (!media || !Array.isArray(media)) {
      return {
        images: [],
        videos: [],
        totalCount: 0,
        imageCount: 0,
        videoCount: 0,
        hasMultiple: false,
        isEmpty: true,
      };
    }
    
    const images = media.filter(item => item.type === 'image');
    const videos = media.filter(item => item.type === 'video');
    return {
      images,
      videos,
      totalCount: media.length,
      imageCount: images.length,
      videoCount: videos.length,
      hasMultiple: media.length > 1,
      isEmpty: media.length === 0
    };
  }, [media]);

  // Current media with bounds checking
  const currentMedia = useMemo(() => {
    if (!media || !Array.isArray(media) || media.length === 0) {
      return null;
    }
    return media[currentMediaIndex] || media[0] || null;
  }, [media, currentMediaIndex]);

  // Navigation functions with improved bounds checking
  const goToPrevious = useCallback(() => {
    if (mediaStats.totalCount <= 1) return;
    setCurrentMediaIndex(prev => (prev === 0 ? mediaStats.totalCount - 1 : prev - 1));
  }, [mediaStats.totalCount]);

  const goToNext = useCallback(() => {
    if (mediaStats.totalCount <= 1) return;
    setCurrentMediaIndex(prev => (prev === mediaStats.totalCount - 1 ? 0 : prev + 1));
  }, [mediaStats.totalCount]);

  // Generic swipe handler
  const handleSwipe = useCallback((startX: number, endX: number) => {
    if (!mediaStats.hasMultiple) return;
    
    const distance = startX - endX;
    const isLeftSwipe = distance > SWIPE_THRESHOLD;
    const isRightSwipe = distance < -SWIPE_THRESHOLD;

    if (isLeftSwipe || isRightSwipe) {
      if (isRTL) {
        // In RTL mode, reverse the swipe direction
        if (isLeftSwipe) {
          goToPrevious();
        } else {
          goToNext();
        }
      } else {
        // In LTR mode, normal swipe direction
        if (isLeftSwipe) {
          goToNext();
        } else {
          goToPrevious();
        }
      }
    }
  }, [mediaStats.hasMultiple, isRTL, goToPrevious, goToNext]);

  // Touch handlers for swipe functionality
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.targetTouches[0].clientX;
    setTouchState({ start: startX, end: null, isActive: true });
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchState.start) return;
    e.preventDefault();
    const moveX = e.targetTouches[0].clientX;
    setTouchState(prev => ({ ...prev, end: moveX }));
  }, [touchState.start]);

  const onTouchEnd = useCallback(() => {
    if (touchState.start && touchState.end) {
      handleSwipe(touchState.start, touchState.end);
    }
    setTouchState({ start: null, end: null, isActive: false });
  }, [touchState.start, touchState.end, handleSwipe]);

  // Mouse handlers for desktop drag simulation
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setMouseState({ start: e.clientX, end: null, isActive: true });
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mouseState.start || !mouseState.isActive) return;
    setMouseState(prev => ({ ...prev, end: e.clientX }));
  }, [mouseState.start, mouseState.isActive]);

  const onMouseUp = useCallback(() => {
    if (mouseState.start && mouseState.end) {
      handleSwipe(mouseState.start, mouseState.end);
    }
    setMouseState({ start: null, end: null, isActive: false });
  }, [mouseState.start, mouseState.end, handleSwipe]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          // Navigate based on RTL/LTR direction
          if (isRTL) {
            goToNext();
          } else {
            goToPrevious();
          }
          break;
        case 'ArrowRight':
          // Navigate based on RTL/LTR direction
          if (isRTL) {
            goToPrevious();
          } else {
            goToNext();
          }
          break;
        case 'Escape':
          setIsModalOpen(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isRTL, goToPrevious, goToNext]);

  // Memoized utility functions
  const videoUtils = useMemo(() => ({
    isYouTubeUrl: (url: string): boolean => {
      try {
        return url.includes('youtube.com') || url.includes('youtu.be');
      } catch {
        return false;
      }
    },
    
    getYouTubeEmbedUrl: (url: string): string => {
      try {
        let videoId = '';
        
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch')) {
          const urlParams = new URLSearchParams(new URL(url).search);
          videoId = urlParams.get('v') || '';
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
      } catch {
        return '';
      }
    }
  }), []);

  // Memoized render functions for better performance
  const renderImageContent = useCallback((item: CarMedia, idx: number = 0, isModalView: boolean = false) => (
    <Image
      src={item.url}
      alt={item.alt || `Image ${idx + 1}`}
      fill
      style={{ objectFit: 'contain' }}
      className="w-full h-full"
      priority={!isModalView && idx === initialIndex}
      sizes={isModalView ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
    />
  ), [initialIndex]);

  const renderVideoContent = useCallback((item: CarMedia) => {
    if (!item.url) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Video unavailable</p>
        </div>
      );
    }

    if (videoUtils.isYouTubeUrl(item.url)) {
      const embedUrl = videoUtils.getYouTubeEmbedUrl(item.url);
      if (!embedUrl) {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Invalid YouTube URL</p>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full">
            <iframe
              src={embedUrl}
              title={item.alt || 'Video content'}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <video
          src={item.url}
          controls
          className="w-full h-full object-contain"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }, [videoUtils]);



  // Early return for empty media
  if (mediaStats.isEmpty) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No media available</p>
      </div>
    );
  }

  // Debug logging in development (optimized)
  if (process.env.NODE_ENV === 'development') {
    console.log('CarMediaGallery Debug:', {
      mediaCount: mediaStats.totalCount,
      imagesCount: mediaStats.imageCount,
      videosCount: mediaStats.videoCount,
      initialIndex,
      currentMediaIndex,
      currentMediaType: currentMedia?.type,
      firstImage: mediaStats.images[0]?.url,
      videoUrls: mediaStats.videos.map(v => v.url)
    });
  }

  // Main component rendering
  return (
    <div className={`car-media-gallery ${className}`}>
      {/* Main media viewer - shows current selected media (image or video) */}
      <div 
        ref={mainGalleryRef}
        className="relative h-80 md:h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ touchAction: 'pan-y' }}
      >
        {currentMedia && (
          <>
            {currentMedia.type === 'image' ? (
              /* Show current image */
              <div 
                className="h-full cursor-pointer" 
                onClick={() => setIsModalOpen(true)}
              >
                {renderImageContent(currentMedia, currentMediaIndex, false)}
              </div>
            ) : (
              /* Show current video thumbnail with play button */
              <div 
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={() => setSelectedVideo(currentMedia)}
              >
                {currentMedia.thumbnailUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentMedia.thumbnailUrl}
                      alt={currentMedia.alt}
                      fill
                      style={{ objectFit: 'contain' }}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity">
                      <div className="bg-black bg-opacity-60 rounded-full p-5 text-white">
                        <Play className="w-12 h-12" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Play className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {/* Media count stamp - AutoTrader style */}
            <div className={`absolute top-3 z-20 ${isRTL ? 'right-3' : 'left-3'}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-md px-2.5 py-1.5 text-white text-sm font-medium`}>
                {mediaStats.totalCount === 1 ? (
                  // For single item, show just the type icon
                  currentMedia?.type === 'image' ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )
                ) : (
                  // For multiple items, show counts like AutoTrader
                  <>
                    {mediaStats.videoCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <Video className="w-5 h-5" />
                        {mediaStats.videoCount > 1 && <span>{mediaStats.videoCount}</span>}
                      </div>
                    )}
                    {mediaStats.imageCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <Camera className="w-5 h-5" />
                        {mediaStats.imageCount > 1 && <span>{mediaStats.imageCount}</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* View gallery button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className={`absolute bottom-3 z-20 flex items-center ${isRTL ? 'space-x-reverse space-x-2 left-3' : 'space-x-2 right-3'} bg-black bg-opacity-70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium hover:bg-opacity-80 transition-all duration-200`}
            >
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-white rounded-sm opacity-80"></div>
                <div className="w-2 h-2 bg-white rounded-sm opacity-80"></div>
                <div className="w-2 h-2 bg-white rounded-sm opacity-80"></div>
                <div className="w-2 h-2 bg-white rounded-sm opacity-80"></div>
              </div>
              <span>{mediaStats.totalCount === 1 ? t('viewImage') : t('viewGallery')}</span>
            </button>
            
            {/* Navigation arrows for all media - AutoTrader style */}
            {mediaStats.hasMultiple && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full text-gray-800 hover:bg-gray-50 transition-all duration-200 border border-gray-200`}
                  aria-label="Previous media"
                >
                  {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full text-gray-800 hover:bg-gray-50 transition-all duration-200 border border-gray-200`}
                  aria-label="Next media"
                >
                  {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              </>
            )}
            
            {/* Media counter - AutoTrader style (always show) */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black bg-opacity-75 text-white text-sm font-medium rounded-lg">
              {currentMediaIndex + 1}/{mediaStats.totalCount}
            </div>

            {/* Swipe hint for touch devices and drag hint for desktop */}
            {mediaStats.hasMultiple && (
              <div className={`absolute bottom-4 left-4 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-md transition-opacity duration-200 ${(touchState.isActive || mouseState.isActive) ? 'opacity-100' : 'opacity-0 md:opacity-60'}`}>
                <span className="md:hidden">{isRTL ? '← اسحب للتنقل →' : '← Swipe to navigate →'}</span>
                <span className="hidden md:inline">{isRTL ? '← اسحب للتنقل →' : '← Drag to navigate →'}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Thumbnail navigation for all media (images and videos) */}
      {mediaStats.hasMultiple && (
        <div className="mt-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {media.map((item, idx) => (
              <div 
                key={`thumb-${idx}`}
                className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                  currentMediaIndex === idx 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentMediaIndex(idx)}
              >
                {item.type === 'image' ? (
                  <>
                    <Image
                      src={item.url}
                      alt={item.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full"
                      sizes={THUMBNAIL_SIZES}
                    />
                    {/* Image type indicator */}
                    <div className="absolute top-1 right-1">
                      <Camera className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src={item.thumbnailUrl || '/placeholder-video.jpg'}
                      alt={item.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="w-full h-full"
                      sizes={THUMBNAIL_SIZES}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    {/* Video type indicator */}
                    <div className="absolute top-1 right-1">
                      <Video className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute top-1 left-1 bg-black bg-opacity-60 rounded px-1 py-0.5 text-white text-xs">
                      Video
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug section for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>Debug:</strong> Total media: {mediaStats.totalCount}, Current: {currentMediaIndex + 1}, 
          Type: {currentMedia?.type}, Images: {mediaStats.imageCount}, Videos: {mediaStats.videoCount}
        </div>
      )}

      {/* Modal/Lightbox for all media (images and videos) */}
      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-95" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center">
            <div 
              ref={modalRef}
              className="relative w-full h-full max-w-none bg-black select-none cursor-grab active:cursor-grabbing"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-7 h-7" />
              </button>

              {/* Media counter in modal */}
              {mediaStats.hasMultiple && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                  {t('mediaCount', { current: currentMediaIndex + 1, total: mediaStats.totalCount })}
                </div>
              )}

              {/* Current media content */}
              <div className="h-full flex items-center justify-center">
                {currentMedia?.type === 'image' ? (
                  <div className="relative w-full h-full max-w-[90vw] max-h-[90vh]">
                    {renderImageContent(currentMedia, currentMediaIndex, true)}
                  </div>
                ) : currentMedia?.type === 'video' ? (
                  <div className="w-full h-full max-w-[90vw] max-h-[90vh]">
                    {renderVideoContent(currentMedia)}
                  </div>
                ) : null}
              </div>
                
              {/* Modal navigation arrows - for all media */}
              {mediaStats.hasMultiple && (
                <>
                  <button
                    onClick={() => goToPrevious()}
                    className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Previous media"
                  >
                    {isRTL ? <ChevronRight className="w-7 h-7" /> : <ChevronLeft className="w-7 h-7" />}
                  </button>

                  <button
                    onClick={() => goToNext()}
                    className={`absolute ${isRTL ? 'left-6' : 'right-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Next media"
                  >
                    {isRTL ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
                  </button>
                </>
              )}


            </div>
          </div>
        </Dialog>
      )}

      {/* Video modal */}
      {selectedVideo && (
        <Dialog
          open={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          className="fixed inset-0 z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-95" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-none bg-black">
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                aria-label="Close video"
              >
                <X className="w-7 h-7" />
              </button>

              {/* Video content */}
              <div className="w-full h-full flex items-center justify-center">
                {renderVideoContent(selectedVideo)}
              </div>
              
              {/* Video navigation buttons - Only show if we have multiple videos */}
              {mediaStats.videoCount > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the current video index
                      const currentIndex = mediaStats.videos.findIndex(v => v.url === selectedVideo.url);
                      // Calculate the previous index (loop back to end if at start)
                      const prevIndex = currentIndex <= 0 ? mediaStats.videoCount - 1 : currentIndex - 1;
                      // Set the selected video to the previous one
                      setSelectedVideo(mediaStats.videos[prevIndex]);
                      // Update current media index to match the video
                      const videoMediaIndex = media.findIndex(item => item === mediaStats.videos[prevIndex]);
                      if (videoMediaIndex >= 0) {
                        setCurrentMediaIndex(videoMediaIndex);
                      }
                    }}
                    className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Previous video"
                  >
                    {isRTL ? <ChevronRight className="w-7 h-7" /> : <ChevronLeft className="w-7 h-7" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the current video index
                      const currentIndex = mediaStats.videos.findIndex(v => v.url === selectedVideo.url);
                      // Calculate the next index (loop back to start if at end)
                      const nextIndex = currentIndex >= mediaStats.videoCount - 1 ? 0 : currentIndex + 1;
                      // Set the selected video to the next one
                      setSelectedVideo(mediaStats.videos[nextIndex]);
                      // Update current media index to match the video
                      const videoMediaIndex = media.findIndex(item => item === mediaStats.videos[nextIndex]);
                      if (videoMediaIndex >= 0) {
                        setCurrentMediaIndex(videoMediaIndex);
                      }
                    }}
                    className={`absolute ${isRTL ? 'left-6' : 'right-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Next video"
                  >
                    {isRTL ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
                  </button>
                  
                  {/* Video counter in modal */}
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                    {t('mediaCount', { current: mediaStats.videos.findIndex(v => v.url === selectedVideo.url) + 1, total: mediaStats.videoCount })}
                  </div>
                </>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default CarMediaGallery;
