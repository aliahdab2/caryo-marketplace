import React from 'react';

interface SkeletonProps {
  /**
   * Custom className for styling the skeleton
   * Use Tailwind utilities for height, width, margin, etc.
   * Example: "h-4 w-full mb-2"
   */
  className?: string;
}

/**
 * Primitive skeleton component for loading states
 * 
 * @example
 * // Simple text skeleton
 * <Skeleton className="h-4 w-3/4" />
 * 
 * @example
 * // Image skeleton
 * <Skeleton className="h-52 w-full rounded-xl" />
 * 
 * @example
 * // Circle/avatar skeleton
 * <Skeleton className="h-12 w-12 rounded-full" />
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse bg-gray-300 dark:bg-gray-700 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

Skeleton.displayName = 'Skeleton';

export default Skeleton;
