'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CarMediaGalleryProps, CarMedia } from './types';
import 'keen-slider/keen-slider.min.css';

// Import components and icons
import { Dialog } from '@headlessui/react';
import { X, ChevronLeft, ChevronRight, Play, Camera, Video } from 'lucide-react';

// RTL support
import { useLanguageDirection } from '@/utils/languageDirection';

// Translation support
import { useTranslation } from 'react-i18next';

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
  const [loaded, setLoaded] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<CarMedia | null>(null);
  
  // Don't separate media - use all media together for unified navigation
  const currentMedia = media[currentMediaIndex] || media[0];
  
  // Separate images and videos (for legacy modal functionality)
  const images = media.filter(item => item.type === 'image');
  const videos = media.filter(item => item.type === 'video');
  
  // Set loaded state immediately since we're not using keen-slider for main navigation
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          // Navigate to previous media
          const prevIndex = currentMediaIndex === 0 ? media.length - 1 : currentMediaIndex - 1;
          setCurrentMediaIndex(prevIndex);
          break;
        case 'ArrowRight':
          // Navigate to next media
          const nextIndex = currentMediaIndex === media.length - 1 ? 0 : currentMediaIndex + 1;
          setCurrentMediaIndex(nextIndex);
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
  }, [isModalOpen, currentMediaIndex, media.length]);

  // Function to determine if a URL is a YouTube video
  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Function to get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string): string => {
    let videoId = '';
    
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(new URL(url).search);
      videoId = urlParams.get('v') || '';
    }
    
    return `https://www.youtube.com/embed/${videoId}`;
  };

  // Render function for image content (used in both main gallery and modal)
  const renderImageContent = (item: CarMedia, idx: number = 0, isModalView: boolean = false) => (
    <Image
      src={item.url}
      alt={item.alt}
      fill
      style={{ objectFit: 'contain' }}
      className="w-full h-full"
      priority={!isModalView && idx === initialIndex} // Only priority for initial image in main gallery
    />
  );



  // Render function for video content in modal
  const renderVideoContent = (item: CarMedia) => {
    if (isYouTubeUrl(item.url)) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full h-full">
            <iframe
              src={getYouTubeEmbedUrl(item.url)}
              title={item.alt}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <video
            src={item.url}
            controls
            className="w-full h-full object-contain"
            autoPlay
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
  };



  // Check if media is available
  if (!media || media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No media available</p>
      </div>
    );
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('CarMediaGallery Debug:', {
      mediaCount: media.length,
      imagesCount: images.length,
      videosCount: videos.length,
      initialIndex,
      currentMediaIndex,
      currentMediaType: currentMedia?.type,
      loaded,
      firstImage: images[0]?.url,
      videoUrls: videos.map(v => v.url)
    });
  }

  // Main component rendering
  return (
    <div className={`car-media-gallery ${className}`}>
      {/* Main media viewer - shows current selected media (image or video) */}
      <div className="relative h-80 md:h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden">
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
                {media.length === 1 ? (
                  // For single item, show just the type icon
                  currentMedia?.type === 'image' ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )
                ) : (
                  // For multiple items, show counts like AutoTrader
                  <>
                    {videos.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Video className="w-5 h-5" />
                        {videos.length > 1 && <span>{videos.length}</span>}
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Camera className="w-5 h-5" />
                        {images.length > 1 && <span>{images.length}</span>}
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
              <span>{media.length === 1 ? t('viewImage') : t('viewGallery')}</span>
            </button>
            
            {/* Navigation arrows for all media - AutoTrader style */}
            {media.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex(prev => (prev === 0 ? media.length - 1 : prev - 1));
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full text-gray-800 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                  aria-label="Previous media"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex(prev => (prev === media.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white shadow-lg rounded-full text-gray-800 hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                  aria-label="Next media"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            
            {/* Media counter - AutoTrader style (always show) */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black bg-opacity-75 text-white text-sm font-medium rounded-lg">
              {currentMediaIndex + 1}/{media.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail navigation for all media (images and videos) */}
      {media.length > 1 && (
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
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, (max-width: 1024px) 12vw, 10vw"
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
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 16vw, (max-width: 1024px) 12vw, 10vw"
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
          <strong>Debug:</strong> Total media: {media.length}, Current: {currentMediaIndex + 1}, 
          Type: {currentMedia?.type}, Images: {images.length}, Videos: {videos.length}
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
            <div className="relative w-full h-full max-w-none bg-black">
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-7 h-7" />
              </button>

              {/* Media counter in modal */}
              {media.length > 1 && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                  {t('mediaCount', { current: currentMediaIndex + 1, total: media.length })}
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
              {media.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const prevIndex = currentMediaIndex === 0 ? media.length - 1 : currentMediaIndex - 1;
                      setCurrentMediaIndex(prevIndex);
                    }}
                    className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Previous media"
                  >
                    {isRTL ? <ChevronRight className="w-7 h-7" /> : <ChevronLeft className="w-7 h-7" />}
                  </button>

                  <button
                    onClick={() => {
                      const nextIndex = currentMediaIndex === media.length - 1 ? 0 : currentMediaIndex + 1;
                      setCurrentMediaIndex(nextIndex);
                    }}
                    className={`absolute ${isRTL ? 'left-6' : 'right-6'} top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200`}
                    aria-label="Next media"
                  >
                    {isRTL ? <ChevronLeft className="w-7 h-7" /> : <ChevronRight className="w-7 h-7" />}
                  </button>
                </>
              )}

              {/* Modal thumbnail navigation */}
              {media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
                  <div className={`flex ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} max-w-[80vw] overflow-x-auto px-4`}>
                    {media.map((item, idx) => (
                      <button
                        key={`modal-thumb-${idx}`}
                        onClick={() => setCurrentMediaIndex(idx)}
                        className={`relative flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                          currentMediaIndex === idx 
                            ? 'border-blue-500 ring-2 ring-blue-300' 
                            : 'border-gray-400 hover:border-gray-300'
                        }`}
                      >
                        {item.type === 'image' ? (
                          <Image
                            src={item.url}
                            alt={item.alt}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="w-full h-full"
                            sizes="64px"
                          />
                        ) : (
                          <>
                            <Image
                              src={item.thumbnailUrl || '/placeholder-video.jpg'}
                              alt={item.alt}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="w-full h-full"
                              sizes="64px"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                              <Play className="w-5 h-5 text-white" />
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
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
              {videos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the current video index
                      const currentIndex = videos.findIndex(v => v.url === selectedVideo.url);
                      // Calculate the previous index (loop back to end if at start)
                      const prevIndex = currentIndex <= 0 ? videos.length - 1 : currentIndex - 1;
                      // Set the selected video to the previous one
                      setSelectedVideo(videos[prevIndex]);
                      // Update current media index to match the video
                      const videoMediaIndex = media.findIndex(item => item === videos[prevIndex]);
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
                      const currentIndex = videos.findIndex(v => v.url === selectedVideo.url);
                      // Calculate the next index (loop back to start if at end)
                      const nextIndex = currentIndex >= videos.length - 1 ? 0 : currentIndex + 1;
                      // Set the selected video to the next one
                      setSelectedVideo(videos[nextIndex]);
                      // Update current media index to match the video
                      const videoMediaIndex = media.findIndex(item => item === videos[nextIndex]);
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
                    {t('mediaCount', { current: videos.findIndex(v => v.url === selectedVideo.url) + 1, total: videos.length })}
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
