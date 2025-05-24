"use client";

import { fluidValue } from '@/utils/responsive';
import type { ResponsiveCardProps } from '@/types/responsive';

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
        bg-white dark:bg-gray-800 rounded-lg shadow 
        ${aspectRatioClass}
        ${hoverClasses}
        ${className}
      `}
      style={{
        // Use CSS to make padding responsive and fluid
        padding: fluidValue(0.5, 1.5, 375, 1280, 'rem'),
        borderRadius: fluidValue(0.375, 0.5, 375, 1280, 'rem'),
      }}
    >
      {children}
    </div>
  );
}
