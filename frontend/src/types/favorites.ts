import { Listing } from './listings';

/**
 * Interface for favorite action handlers
 */
export interface FavoriteHandlers {
  onToggle?: (isFavorite: boolean) => void;
  mockMode?: boolean;
  initialFavorite?: boolean;
}

/**
 * Interface for favorites service options
 */
export interface FavoriteServiceOptions {
  mockMode?: boolean;
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
  total: number;
}
