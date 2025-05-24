'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useResponsive } from '@/utils/responsive';
import type { ResponsiveImageProps } from '@/types/responsive';

/**
 * A responsive image component that selects different image sources based on screen size
 * and handles image loading errors
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  fallbackSrc = '/images/logo.svg',
  aspectRatio = 'aspect-square', // Default 1:1 aspect ratio
  objectFit = 'cover',
  rounded = false,
  alt,
  width,
  height,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    typeof src === 'string' ? src : src.default
  );
  const [imgError, setImgError] = useState<boolean>(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Determine which image source to use based on screen size
  React.useEffect(() => {
    if (typeof src !== 'string' && !imgError) {
      if (isMobile && src.mobile) {
        setImgSrc(src.mobile);
      } else if (isTablet && src.tablet) {
        setImgSrc(src.tablet);
      } else if (isDesktop && src.desktop) {
        setImgSrc(src.desktop);
      } else {
        setImgSrc(src.default);
      }
    }
  }, [isMobile, isTablet, isDesktop, src, imgError]);
  
  // Handle image loading error
  const handleError = () => {
    if (!imgError) {
      setImgSrc(fallbackSrc);
      setImgError(true);
    }
  };
  
  // Generate rounded classes
  const roundedClass = rounded === true 
    ? 'rounded'
    : rounded === 'sm'
      ? 'rounded-sm' 
      : rounded === 'md'
        ? 'rounded-md'
        : rounded === 'lg'
          ? 'rounded-lg'
          : rounded === 'full'
            ? 'rounded-full'
            : '';
  
  // Generate object fit classes
  const objectFitClass = objectFit === 'cover'
    ? 'object-cover'
    : objectFit === 'contain'
      ? 'object-contain'
      : 'object-fill';
  
  return (
    <div className={`relative ${aspectRatio} ${containerClassName} overflow-hidden ${roundedClass}`}>
      <Image
        src={imgSrc}
        alt={alt || 'Image'}
        fill={!width || !height}
        width={width}
        height={height}
        onError={handleError}
        className={`${objectFitClass} ${className}`}
        {...props}
      />
    </div>
  );
};
