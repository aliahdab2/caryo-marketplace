"use client";

import { ReactNode } from 'react';
import { fluidValue } from '@/utils/responsive';

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | string;
  hover?: boolean;
}

/**
 * A responsive card component that maintains proper proportions across screen sizes
 */
export default function ResponsiveCard({
  children,
  className = '',
  aspectRatio = 'auto',
  hover = false,
}: ResponsiveCardProps) {
  // Define aspect ratio values
  const aspectRatioClass = (() => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'video': return 'aspect-video'; // 16:9
      case 'portrait': return 'aspect-[3/4]';
      case 'landscape': return 'aspect-[4/3]';
      default: return typeof aspectRatio === 'string' ? `aspect-[${aspectRatio}]` : '';
    }
  })();
  
  // Build hover effect classes
  const hoverClasses = hover ? 
    'transition-transform duration-200 hover:scale-[1.02] hover:shadow-md' : '';
  
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 shadow 
        ${aspectRatioClass}
        ${hoverClasses}
        ${className}
      `}
      style={{
        // Use CSS to make padding responsive and fluid - more gradual transition
        padding: fluidValue(0.4, 1.8, 320, 1600, 'rem'),
        borderRadius: fluidValue(0.25, 0.625, 320, 1600, 'rem'),
        boxShadow: `0 ${fluidValue(1, 4, 320, 1600, 'px')} ${fluidValue(3, 12, 320, 1600, 'px')} rgba(0, 0, 0, ${fluidValue(0.05, 0.1, 320, 1600, '')})`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, padding 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}
