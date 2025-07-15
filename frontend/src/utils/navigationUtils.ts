/**
 * Navigation utilities for consistent URL generation across the application
 * Ensures proper slug formatting and search page integration
 */

/**
 * Creates a URL-friendly slug from a display name
 * @param name - The display name to convert
 * @returns A URL-safe slug or empty string if invalid input
 */
export const createSlug = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  return name.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    // Keep Arabic characters, alphanumeric, and hyphens only
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
};

/**
 * Creates a compound model slug in the format brand-model
 * This matches the backend's expected slug format (e.g., "toyota-camry")
 * @param brandName - The brand display name
 * @param modelName - The model display name
 * @returns A compound slug or empty string if invalid input
 */
export const createModelSlug = (brandName: string, modelName: string): string => {
  const brandSlug = createSlug(brandName);
  const modelSlug = createSlug(modelName);
  
  if (!brandSlug || !modelSlug) return '';
  
  return `${brandSlug}-${modelSlug}`;
};

/**
 * Builds a search URL with brand filter
 * @param brandName - The brand display name
 * @returns A complete search URL with brand filter
 */
export const buildBrandSearchUrl = (brandName: string): string => {
  const brandSlug = createSlug(brandName);
  if (!brandSlug) return '/search';
  
  return `/search?brand=${encodeURIComponent(brandSlug)}`;
};

/**
 * Builds a search URL with brand and model filters
 * @param brandName - The brand display name
 * @param modelName - The model display name
 * @returns A complete search URL with brand and model filters
 */
export const buildModelSearchUrl = (brandName: string, modelName: string): string => {
  const brandSlug = createSlug(brandName);
  const modelSlug = createModelSlug(brandName, modelName);
  
  if (!brandSlug || !modelSlug) return '/search';
  
  return `/search?brand=${encodeURIComponent(brandSlug)}&model=${encodeURIComponent(modelSlug)}`;
};

/**
 * Navigation constants for consistent routing
 */
export const NAVIGATION_ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  LISTINGS: '/listings',
  FAVORITES: '/favorites',
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  SETTINGS: '/dashboard/settings',
  CONTACT: '/contact',
  SIGNIN: '/auth/signin',
  SIGNUP: '/auth/signup'
} as const;

/**
 * Navigation route type for type safety
 */
export type NavigationRoute = typeof NAVIGATION_ROUTES[keyof typeof NAVIGATION_ROUTES];

/**
 * Validates if a route is a known navigation route
 * @param route - The route to validate
 * @returns True if the route is a valid navigation route
 */
export const isValidNavigationRoute = (route: string): route is NavigationRoute => {
  return Object.values(NAVIGATION_ROUTES).includes(route as NavigationRoute);
};
