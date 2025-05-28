# Implementation Example with keen-slider

This guide provides a brief overview of how to implement the CarMediaGallery component with keen-slider for smooth swipe interactions.

## Basic Setup

1. Install the required dependencies:

```bash
npm install @headlessui/react @heroicons/react keen-slider
# or
yarn add @headlessui/react @heroicons/react keen-slider
```

2. Import the keen-slider styles in your component or global CSS:

```tsx
import 'keen-slider/keen-slider.min.css'
```

## Example Implementation

Here's a simplified example showing how keen-slider is integrated into the CarMediaGallery component:

```tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';
import { useKeenSlider } from 'keen-slider/react';
import { CarMediaGalleryProps, CarMedia } from './types';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';

export const CarMediaGallery: React.FC<CarMediaGalleryProps> = ({
  media,
  initialIndex = 0,
  showThumbnails = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Main gallery slider instance
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: initialIndex,
    slideChanged(slider) {
      setCurrentIndex(slider.track.details.rel);
    },
    slides: {
      perView: 1,
      spacing: 0,
    },
    loop: true,
    drag: true,
    rubberband: true,
  });
  
  // Modal slider instance (separate instance for the modal)
  const [modalSliderRef, modalInstanceRef] = useKeenSlider<HTMLDivElement>({
    initial: currentIndex,
    slideChanged(slider) {
      setCurrentIndex(slider.track.details.rel);
    },
    slides: {
      perView: 1,
      spacing: 0,
    },
    loop: true,
    drag: true,
    rubberband: true,
  });

  // Navigation functions
  const goToNext = useCallback(() => {
    instanceRef.current?.next();
    modalInstanceRef.current?.next();
  }, [instanceRef, modalInstanceRef]);

  const goToPrevious = useCallback(() => {
    instanceRef.current?.prev();
    modalInstanceRef.current?.prev();
  }, [instanceRef, modalInstanceRef]);
  
  // Update modal slider when current index changes
  useEffect(() => {
    if (isModalOpen && modalInstanceRef.current) {
      modalInstanceRef.current.moveToIdx(currentIndex);
    }
  }, [currentIndex, isModalOpen, modalInstanceRef]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
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
  }, [isModalOpen, goToNext, goToPrevious]);

  // Render main gallery view
  return (
    <div className={`car-media-gallery ${className}`}>
      {/* Main slider */}
      <div 
        className="relative h-80 md:h-96 lg:h-[500px] bg-gray-100 rounded-lg overflow-hidden"
      >
        <div ref={sliderRef} className="keen-slider h-full">
          {media.map((item, idx) => (
            <div 
              key={`slide-${idx}`} 
              className="keen-slider__slide cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              {renderMediaContent(item)}
            </div>
          ))}
        </div>
        
        {/* Navigation arrows for main view */}
        {media.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {renderThumbnails()}

      {/* Modal/Lightbox */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-75" />

          <div className="relative bg-black w-full max-w-5xl mx-auto z-10 p-2">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Modal slider */}
            <div className="h-[80vh] flex items-center justify-center">
              <div ref={modalSliderRef} className="keen-slider h-full w-full">
                {media.map((item, idx) => (
                  <div 
                    key={`modal-slide-${idx}`} 
                    className="keen-slider__slide"
                  >
                    {renderMediaContent(item, true)}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal navigation arrows */}
            {media.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Modal thumbnails */}
            {showThumbnails && media.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {media.map((item, index) => (
                  <button
                    key={`modal-thumb-${index}`}
                    onClick={() => {
                      setCurrentIndex(index);
                      modalInstanceRef.current?.moveToIdx(index);
                    }}
                    className={`relative w-12 h-12 rounded-md overflow-hidden focus:outline-none ${
                      currentIndex === index ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {/* Thumbnail image */}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
};

// Helper function to render media content based on type
function renderMediaContent(item: CarMedia, inModal: boolean = false) {
  // Implementation for rendering images and videos
  // ...
}
```

## keen-slider Configuration Options

You can customize the slider behavior by adjusting the keen-slider options:

```tsx
const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
  // Start with a specific slide
  initial: initialIndex,
  
  // Event handling
  slideChanged(slider) {
    setCurrentIndex(slider.track.details.rel);
  },
  
  // Slide settings
  slides: {
    perView: 1,     // Show one slide at a time
    spacing: 0,     // No spacing between slides
  },
  
  // Navigation options
  loop: true,       // Enable infinite looping
  drag: true,       // Enable drag to navigate
  rubberband: true, // Elastic feel at boundaries
  
  // Animation settings
  mode: "snap",     // Snap to slide after dragging
  duration: 500,    // Transition duration in ms
  
  // Responsive options
  breakpoints: {
    "(min-width: 768px)": {
      slides: { perView: 1 }
    }
  }
});
```

## Handling Video Content

When dealing with video content, you might want to disable dragging on the video element to prevent conflicts with video controls:

```tsx
// For video slides, add this to prevent drag conflicts
if (item.type === 'video') {
  return (
    <div className="keen-slider__slide">
      <div 
        className="video-container" 
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Video player here */}
      </div>
    </div>
  );
}
```

This example shows the basic implementation pattern. Adjust it according to your specific UI requirements and project setup.
