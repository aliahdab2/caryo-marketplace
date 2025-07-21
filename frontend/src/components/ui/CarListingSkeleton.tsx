import React from 'react';

interface CarListingSkeletonProps {
  className?: string;
}

/**
 * Loading skeleton component for car listing cards
 * Provides a placeholder while car listing data is loading
 */
const CarListingSkeleton: React.FC<CarListingSkeletonProps> = ({ 
  className = "" 
}) => (
  <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse ${className}`}>
    <div className="aspect-w-16 aspect-h-12 bg-gray-300 h-48"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
      <div className="h-5 bg-gray-300 rounded w-1/2"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

CarListingSkeleton.displayName = 'CarListingSkeleton';

export default CarListingSkeleton;
