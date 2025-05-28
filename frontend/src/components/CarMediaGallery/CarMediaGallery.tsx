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
  const [selectedVideo, setSelectedVideo] = useState<CarMedia | null>(null);
  
  // Separate images and videos
  const images = media.filter(item => item.type === 'image');
  const videos = media.filter(item => item.type === 'video');
  
  // State for managing video navigation when only videos are present
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  // Initialize the gallery slider with keen-slider (images only)
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialIndex,
    loop: images.length > 1,
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

  // Initialize the modal slider with keen-slider (images only)
  const [modalSliderRef, modalInstanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0, // Always start at 0
    loop: images.length > 1,
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

  // Render function for video thumbnails
  const renderVideoThumbnail = (item: CarMedia) => {
    const thumbnailSrc = item.thumbnailUrl || item.url || '/placeholder-video.jpg';
    
    return (
      <div 
        className="relative w-full h-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => setSelectedVideo(item)}
      >
        {item.thumbnailUrl || item.url ? (
          <Image
            src={thumbnailSrc}
            alt={item.alt}
            fill
            style={{ objectFit: 'cover' }}
            className="w-full h-full"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <PlayIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity">
          <div className="bg-black bg-opacity-60 rounded-full p-3 text-white">
            <PlayIcon className="w-8 h-8" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 rounded px-2 py-1 text-white text-xs">
          Video
        </div>
      </div>
    );
  };

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

  // Main component rendering
  return (
    <div className={`car-media-gallery ${className}`}>
      {/* Main gallery container - Conditionally displays either images or videos */}
      {(images.length > 0 || (images.length === 0 && videos.length > 0)) && (
        <div className="relative h-80 md:h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden">
          {/* If we have images, show the image slider */}
          {images.length > 0 && (
            <div 
              ref={sliderRef} 
              className="keen-slider h-full cursor-pointer" 
              onClick={() => setIsModalOpen(true)}
              style={{ touchAction: 'pan-x' }}
            >
              {images.map((item, idx) => (
                <div key={`slide-${idx}`} className="keen-slider__slide" style={{ userSelect: 'none' }}>
                  {renderImageContent(item)}
                </div>
              ))}
            </div>
          )}
          
          {/* If we only have videos (no images), show the current video in the main gallery area */}
          {images.length === 0 && videos.length > 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Display the current video thumbnail with play button */}
                <div 
                  className="relative w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedVideo(videos[currentVideoIndex])}
                >
                  {videos[currentVideoIndex].thumbnailUrl || videos[currentVideoIndex].url ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={videos[currentVideoIndex].thumbnailUrl || videos[currentVideoIndex].url || '/placeholder-video.jpg'}
                        alt={videos[currentVideoIndex].alt}
                        fill
                        style={{ objectFit: 'contain' }}
                        className="w-full h-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-opacity">
                        <div className="bg-black bg-opacity-60 rounded-full p-5 text-white">
                          <PlayIcon className="w-12 h-12" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <PlayIcon className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Video navigation buttons */}
                {videos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentVideoIndex(prev => (prev === 0 ? videos.length - 1 : prev - 1));
                      }}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-opacity"
                      aria-label="Previous video"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentVideoIndex(prev => (prev === videos.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-1.5 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-opacity"
                      aria-label="Next video"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Video counter - positioned the same as the image counter */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                  {currentVideoIndex + 1} of {videos.length}
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation arrows - only for image gallery */}
          {loaded && instanceRef.current && images.length > 1 && (
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
          {loaded && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {currentSlide + 1} of {images.length}
            </div>
          )}
        </div>
      )}

      {/* Video thumbnails section - Only display this if we have BOTH images and videos */}
      {images.length > 0 && videos.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {videos.map((video, idx) => (
              <div key={`video-${idx}`}>
                {renderVideoThumbnail(video)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal/Lightbox with keen-slider for images */}
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
              {images.length > 1 && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                  {modalSlide + 1} of {images.length}
                </div>
              )}

              {/* Image content with keen-slider */}
              <div className="h-full">
                <div ref={modalSliderRef} className="keen-slider h-full">
                  {images.map((item, idx) => (
                    <div 
                      key={`modal-slide-${idx}`} 
                      className="keen-slider__slide flex items-center justify-center"
                      style={{ userSelect: 'none' }}
                    >
                      {item.type === 'image' ? (
                        renderImageContent(item, idx, true) // Corrected: pass idx and true for isModalView
                      ) : (
                        renderVideoContent(item)
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Modal navigation arrows */}
                {images.length > 1 && (
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
                <XMarkIcon className="w-7 h-7" />
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
                      // If we're in the "videos only" view, also update the currentVideoIndex
                      if (images.length === 0) {
                        setCurrentVideoIndex(prevIndex);
                      }
                    }}
                    className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200"
                    aria-label="Previous video"
                  >
                    <ChevronLeftIcon className="w-7 h-7" />
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
                      // If we're in the "videos only" view, also update the currentVideoIndex
                      if (images.length === 0) {
                        setCurrentVideoIndex(nextIndex);
                      }
                    }}
                    className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 p-3 bg-black bg-opacity-20 rounded-full text-white hover:bg-opacity-40 transition-all duration-200"
                    aria-label="Next video"
                  >
                    <ChevronRightIcon className="w-7 h-7" />
                  </button>
                  
                  {/* Video counter in modal */}
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 px-3 py-2 bg-black bg-opacity-20 rounded-md text-white text-lg font-medium">
                    {videos.findIndex(v => v.url === selectedVideo.url) + 1} of {videos.length}
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
