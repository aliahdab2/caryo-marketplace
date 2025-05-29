import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

interface ImageGalleryProps {
  media?: { url: string; type?: string; isPrimary?: boolean }[];
  fallbackImage?: string;
  altText: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ media, fallbackImage, altText }) => {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const imageUrls: string[] = [];
    
    if (media && media.length > 0) {
      const sortedMedia = [...media].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
      
      // Add all media URLs
      imageUrls.push(...sortedMedia.map(item => item.url));
    }
    
    // Add fallback image if provided and not already included
    if (fallbackImage && !imageUrls.includes(fallbackImage)) {
      imageUrls.push(fallbackImage);
    }
    
    setImages(imageUrls);
  }, [media, fallbackImage]);

  if (images.length === 0) {
    return (
      <div className="bg-gray-300 dark:bg-gray-700 h-full w-full flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400">{t('noImageAvailable')}</span>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="relative h-full w-full">
      {/* Main image */}
      <div className="h-full w-full relative">
        <Image 
          src={images[currentImageIndex]} 
          alt={`${altText} - ${currentImageIndex + 1}`} 
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={currentImageIndex === 0}
          className="object-cover"
          unoptimized={images[currentImageIndex].startsWith('data:')}
        />
      </div>
      
      {/* Navigation arrows (only if more than one image) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
            aria-label={t('previous')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
            aria-label={t('next')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Thumbnail navigation (only if more than one image) */}
      {images.length > 1 && (
        <div className="flex justify-center mt-2 space-x-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`h-12 w-16 border-2 transition-all ${
                index === currentImageIndex 
                  ? 'border-blue-500 opacity-100' 
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <div className="relative h-full w-full">
                <Image 
                  src={image} 
                  alt={`Thumbnail ${index + 1}`} 
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={image.startsWith('data:')}
                />
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
          {currentImageIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
