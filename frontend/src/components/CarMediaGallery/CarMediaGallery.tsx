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
  className = '',
}) => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(initialIndex);
  const [modalSlide, setModalSlide] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  
  // Initialize the gallery slider with keen-slider
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialIndex,
    loop: true,
    slides: {
      perView: 1,
      spacing: 0,
    },
    drag: true,
    dragSpeed: 0.8,
    mode: "snap",
    rubberband: true,
    defaultAnimation: {
      duration: 0, // No animation duration for instant transitions
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  // Initialize the modal slider with keen-slider
  const [modalSliderRef, modalInstanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0, // Always start at 0
    loop: true,
    defaultAnimation: {
      duration: 0, // No animation duration for instant transitions
    },
    slideChanged(slider) {
      setModalSlide(slider.track.details.rel);
    },
    drag: true,
    created(slider) {
      // When modal slider is created and modal is open, move to current slide
      if (isModalOpen) {
        slider.moveToIdx(currentSlide, true);
        setModalSlide(currentSlide);
      }
    },
  });

  // Synchronize the modal slider when modal opens
  useEffect(() => {
    if (isModalOpen && modalInstanceRef.current) {
      // Use requestAnimationFrame to ensure the slider is fully initialized
      requestAnimationFrame(() => {
        if (modalInstanceRef.current) {
          modalInstanceRef.current.moveToIdx(currentSlide, true);
          setModalSlide(currentSlide);
        }
      });
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
            className="w-full h-full object-contain select-none"
            priority={!inModal && media.indexOf(item) === 0}
            draggable={false}
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
          <div className={`${containerClass} relative group select-none`}>
            <Image
              src={item.thumbnailUrl || ''}
              alt={item.alt}
              width={item.width || 800}
              height={item.height || 600}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
        <div 
          ref={sliderRef} 
          className="keen-slider h-full cursor-pointer" 
          onClick={() => setIsModalOpen(true)}
          style={{ touchAction: 'pan-x' }}
        >
          {media.map((item, idx) => (
            <div key={`slide-${idx}`} className="keen-slider__slide" style={{ userSelect: 'none' }}>
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
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                instanceRef.current?.next();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Photo counter overlay */}
        {loaded && media.length > 1 && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 px-2 py-1 bg-black bg-opacity-20 rounded-md text-white text-sm font-medium">
            {currentSlide + 1} of {media.length}
          </div>
        )}
      </div>

      {/* Modal/Lightbox with keen-slider */}
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
                <XMarkIcon className="w-7 h-7" />
              </button>

              {/* Photo counter in modal */}
              {media.length > 1 && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                  {modalSlide + 1} of {media.length}
                </div>
              )}

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
                      className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200"
                      aria-label="Previous image"
                    >
                      <ChevronLeftIcon className="w-7 h-7" />
                    </button>

                    <button
                      onClick={() => modalInstanceRef.current?.next()}
                      className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200"
                      aria-label="Next image"
                    >
                      <ChevronRightIcon className="w-7 h-7" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default CarMediaGallery;
