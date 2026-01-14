'use client';

import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { LoadingSkeleton, CardSkeleton, ListSkeleton } from './LoadingSkeleton';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';

type LoadingVariant = 'skeleton' | 'card' | 'list' | 'custom';
type EmptyVariant = 'default' | 'search' | 'favorites' | 'messages' | 'listings' | 'notifications';

interface QueryWrapperProps<T> {
  /** The React Query result object */
  query: UseQueryResult<T, Error>;
  /** Render function for the data */
  children: (data: T) => React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Loading variant for default skeleton */
  loadingVariant?: LoadingVariant;
  /** Number of skeleton items to show */
  loadingCount?: number;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Empty state variant */
  emptyVariant?: EmptyVariant;
  /** Message to show when data is empty */
  emptyMessage?: string;
  /** Title to show when data is empty */
  emptyTitle?: string;
  /** Action button for empty state */
  emptyAction?: React.ReactNode;
  /** Function to check if data is empty (defaults to checking array length) */
  isEmpty?: (data: T) => boolean;
  /** Custom className for wrapper */
  className?: string;
}

/**
 * QueryWrapper - Standardized wrapper for React Query results
 * 
 * Automatically handles loading, error, and empty states for any React Query hook.
 * 
 * @example
 * // Basic usage
 * <QueryWrapper query={listingsQuery} emptyVariant="listings">
 *   {(listings) => <ListingsGrid listings={listings} />}
 * </QueryWrapper>
 * 
 * @example
 * // With custom loading and empty states
 * <QueryWrapper
 *   query={favoritesQuery}
 *   loadingVariant="card"
 *   loadingCount={6}
 *   emptyVariant="favorites"
 *   emptyAction={<Button>Browse Listings</Button>}
 * >
 *   {(favorites) => <FavoritesList favorites={favorites} />}
 * </QueryWrapper>
 */
export function QueryWrapper<T>({
  query,
  children,
  loadingComponent,
  loadingVariant = 'skeleton',
  loadingCount = 3,
  errorComponent,
  emptyComponent,
  emptyVariant = 'default',
  emptyMessage,
  emptyTitle,
  emptyAction,
  isEmpty,
  className = '',
}: QueryWrapperProps<T>) {
  // Handle loading state
  if (query.isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    switch (loadingVariant) {
      case 'card':
        return <CardSkeleton count={loadingCount} />;
      case 'list':
        return <ListSkeleton count={loadingCount} />;
      case 'skeleton':
      default:
        return <LoadingSkeleton count={loadingCount} />;
    }
  }

  // Handle error state
  if (query.error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    return (
      <ErrorDisplay
        error={query.error}
        retry={() => query.refetch()}
        className={className}
      />
    );
  }

  // Handle empty state
  const checkEmpty = isEmpty || defaultIsEmpty;
  if (!query.data || checkEmpty(query.data)) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <EmptyState
        variant={emptyVariant}
        message={emptyMessage}
        title={emptyTitle}
        action={emptyAction}
        className={className}
      />
    );
  }

  // Render children with data
  return <>{children(query.data)}</>;
}

/**
 * Default function to check if data is empty
 */
function defaultIsEmpty<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') {
    // Check for common paginated response shapes
    const obj = data as Record<string, unknown>;
    if ('content' in obj && Array.isArray(obj.content)) {
      return obj.content.length === 0;
    }
    if ('listings' in obj && Array.isArray(obj.listings)) {
      return obj.listings.length === 0;
    }
    if ('favorites' in obj && Array.isArray(obj.favorites)) {
      return obj.favorites.length === 0;
    }
    // Check if object has no keys
    return Object.keys(obj).length === 0;
  }
  return false;
}

export default QueryWrapper;
