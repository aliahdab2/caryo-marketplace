'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CarMediaGalleryProps, CarMedia } from './types';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

// Import icons 
// Note: You may need to install these packages:
// npm install @headlessui/react @heroicons/react keen-slider
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';

/**
 * A Blocket-inspired responsive gallery for displaying car images and videos
 * with swipe navigation in both main view and modal
 */
const CarMediaGallery: React.FC<CarMediaGalleryProps> = ({
  media,
  initialIndex = 0,
  showThumbnails = true,
  className = '',
}) => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  
  // Initialize the gallery slider with keen-slider
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialIndex,
    loop: true,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  // Initialize the modal slider with keen-slider
  const [modalSliderRef, modalInstanceRef] = useKeenSlider<HTMLDivElement>({
    initial: currentSlide,
    loop: true,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    drag: true,
  });

  // Synchronize the modal slider with the main slider
  useEffect(() => {
    if (isModalOpen && modalInstanceRef.current) {
      modalInstanceRef.current.moveToIdx(currentSlide);
    }
  }, [isModalOpen, currentSlide, modalInstanceRef]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          modalInstanceRef.current?.prev();
          break;
        case 'ArrowRight':
          modalInstanceRef.current?.next();
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
  }, [isModalOpen, modalInstanceRef]);

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

  // Render function for media content (used in both main view and modal)
  const renderMediaContent = (item: CarMedia, inModal: boolean = false) => {
    const containerClass = inModal 
      ? 'w-full h-full' 
      : 'w-full h-full rounded-lg overflow-hidden';

    if (item.type === 'image') {
      return (
        <div className={containerClass}>
          <Image
            src={item.url}
            alt={item.alt}
            width={item.width || 800}
            height={item.height || 600}
            className="w-full h-full object-contain"
            priority={!inModal && media.indexOf(item) === 0}
          />
        </div>
      );
    } else if (item.type === 'video') {
      if (inModal) {
        if (isYouTubeUrl(item.url)) {
          return (
            <iframe
              src={getYouTubeEmbedUrl(item.url)}
              title={item.alt}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          );
        } else {
          // MP4 or other video format
          return (
            <video
              src={item.url}
              controls
              autoPlay
              className="w-full h-full"
              title={item.alt}
            />
          );
        }
      } else {
        // Video thumbnail in the main gallery
        return (
          <div className={`${containerClass} relative group`}>
            <Image
              src={item.thumbnailUrl || ''}
              alt={item.alt}
              width={item.width || 800}
              height={item.height || 600}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-50 rounded-full p-3 text-white group-hover:bg-opacity-70 transition-opacity">
                <PlayIcon className="w-10 h-10" />
              </div>
            </div>
          </div>
        );
      }
    }

    return null;
  };

  // Render thumbnail items
  const renderThumbnails = () => {
    if (!showThumbnails || !media || media.length <= 1) return null;

    return (
      <div className="flex space-x-2 mt-2 overflow-x-auto pb-2">
        {media.map((item, index) => (
          <button
            key={`thumb-${index}`}
            onClick={() => {
              instanceRef.current?.moveToIdx(index);
            }}
            className={`relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentSlide === index ? 'ring-2 ring-blue-500' : ''
            }`}
            aria-label={`View ${item.alt}`}
          >
            <Image
              src={item.type === 'video' ? (item.thumbnailUrl || '') : item.url}
              alt={`Thumbnail for ${item.alt}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
            {item.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };

  // Check if media is available
  if (!media || media.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No media available</p>
      </div>
    );
  }

  // Main component rendering
  return (
    <div className={`car-media-gallery ${className}`}>
      {/* Main gallery slider */}
      <div className="relative h-80 md:h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden">
        <div ref={sliderRef} className="keen-slider h-full cursor-pointer" onClick={() => setIsModalOpen(true)}>
          {media.map((item, idx) => (
            <div key={`slide-${idx}`} className="keen-slider__slide">
              {renderMediaContent(item)}
            </div>
          ))}
        </div>
        
        {/* Navigation arrows */}
        {loaded && instanceRef.current && media.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.prev();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.next();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-40 rounded-full text-white hover:bg-opacity-60 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Position indicators (dots) - shown when thumbnails are disabled */}
        {!showThumbnails && loaded && instanceRef.current && media.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <div className="flex space-x-2">
              {[...Array(media.length)].map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    instanceRef.current?.moveToIdx(idx);
                  }}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {renderThumbnails()}

      {/* Modal/Lightbox with keen-slider */}
      {isModalOpen && (
        <Dialog
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50"
        >
          <div className="fixed inset-0 bg-black bg-opacity-95" aria-hidden="true" />
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-none bg-black">
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-7 h-7" />
              </button>

              {/* Media content with keen-slider */}
              <div className="h-full">
                <div ref={modalSliderRef} className="keen-slider h-full">
                  {media.map((item, idx) => (
                    <div key={`modal-slide-${idx}`} className="keen-slider__slide flex items-center justify-center">
                      {renderMediaContent(item, true)}
                    </div>
                  ))}
                </div>
                
                {/* Navigation buttons */}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={() => modalInstanceRef.current?.prev()}
                      className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="w-7 h-7" />
                    </button>

                    <button
                      onClick={() => modalInstanceRef.current?.next()}
                      className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-all duration-200"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="w-7 h-7" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails in modal */}
              {showThumbnails && media.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="flex space-x-2 bg-black bg-opacity-60 rounded-lg p-3">
                    {media.map((item, index) => (
                      <button
                        key={`modal-thumb-${index}`}
                        onClick={() => modalInstanceRef.current?.moveToIdx(index)}
                        className={`relative w-16 h-12 rounded-md overflow-hidden focus:outline-none transition-all duration-200 ${
                          currentSlide === index ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`View ${item.alt}`}
                      >
                        <Image
                          src={item.type === 'video' ? (item.thumbnailUrl || '') : item.url}
                          alt={`Thumbnail for ${item.alt}`}
                          width={64}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <PlayIcon className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Position indicators in modal (dots) - shown when thumbnails are disabled */}
              {!showThumbnails && media.length > 1 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="flex space-x-3 bg-black bg-opacity-60 rounded-lg p-3">
                    {[...Array(media.length)].map((_, idx) => (
                      <button
                        key={`modal-dot-${idx}`}
                        onClick={() => modalInstanceRef.current?.moveToIdx(idx)}
                        className={`w-3 h-3 rounded-full ${
                          idx === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default CarMediaGallery;
