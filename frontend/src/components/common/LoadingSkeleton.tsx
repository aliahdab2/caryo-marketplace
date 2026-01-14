'use client';

import React from 'react';

interface LoadingSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Variant of the skeleton */
  variant?: 'card' | 'list' | 'text' | 'circle' | 'rectangle';
  /** Custom className for styling */
  className?: string;
  /** Height of each skeleton item */
  height?: string | number;
  /** Width of each skeleton item */
  width?: string | number;
}

/**
 * Loading skeleton component for placeholder content
 * 
 * @example
 * <LoadingSkeleton variant="card" count={3} />
 */
export function LoadingSkeleton({
  count = 1,
  variant = 'rectangle',
  className = '',
  height,
  width,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'h-48 w-full rounded-lg';
      case 'list':
        return 'h-16 w-full rounded-md';
      case 'text':
        return 'h-4 w-full rounded';
      case 'circle':
        return 'h-12 w-12 rounded-full';
      case 'rectangle':
      default:
        return 'h-8 w-full rounded';
    }
  };

  const style: React.CSSProperties = {};
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${getVariantClasses()}`}
          style={style}
          role="status"
          aria-label="Loading..."
        />
      ))}
    </div>
  );
}

/**
 * Card skeleton for listing cards
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
          <div className="bg-gray-200 dark:bg-gray-700 h-40 rounded-lg mb-4" />
          <div className="space-y-2">
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-3/4 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton for list views
 */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="bg-gray-200 dark:bg-gray-700 h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="bg-gray-200 dark:bg-gray-700 h-4 w-3/4 rounded" />
            <div className="bg-gray-200 dark:bg-gray-700 h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
