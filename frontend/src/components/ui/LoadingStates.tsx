// Loading components with proper skeleton states
// Provides better user experience with consistent loading states

import React from 'react';

export function CarListingsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Image skeleton */}
          <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            
            {/* Price */}
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            
            {/* Details */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse" />
            </div>
            
            {/* Button */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search bar skeleton */}
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      
      {/* Filter pills skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, index) => (
          <div 
            key={index} 
            className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            style={{ width: `${Math.random() * 60 + 80}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <FiltersSkeleton />
        
        {/* Spacer */}
        <div className="my-8" />
        
        <CarListingsSkeleton />
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
}

export function LoadingSpinner({ size = 'md', color = 'blue' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };
  
  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 ${colorClasses[color]}`} />
  );
}
