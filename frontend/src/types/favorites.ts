import { Listing } from './listings';

/**
 * Interface for favorite action handlers
 */
export interface FavoriteHandlers {
  onToggle?: (isFavorite: boolean) => void;
  initialFavorite?: boolean;
}

/**
 * Type for favorites service options
 */
export interface FavoriteServiceOptions {
  // Options for favorite service operations
  retryCount?: number;
  timeout?: number;
}

/**
 * Interface for favorite status response
 */
export interface FavoriteStatusResponse {
  isFavorite: boolean;
  listingId: string;
}

/**
 * Interface for user favorites response
 */
export interface UserFavoritesResponse {
  favorites: Listing[];
  total?: number; // Make total optional since we don't always need it
}

/**
 * Interface for favorite response from backend
 */
export interface FavoriteResponse {
  id: number;
  userId: number;
  carListingId: number;
  createdAt: string;
}

/**
 * Raw API response types
 */
export type RawFavoritesResponse = 
  | Listing[] 
  | { data: Listing[] }
  | { favorites: Listing[]; total: number };

export type RawFavoriteStatusResponse = 
  | boolean 
  | { isFavorite: boolean } 
  | { status: boolean };
