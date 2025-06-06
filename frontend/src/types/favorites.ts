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
 * @deprecated This type is no longer used as we're using real API calls now
 */
export type FavoriteServiceOptions = Record<string, never>;

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
