/**
 * Custom Hooks Index
 * 
 * Centralized export point for all custom hooks in the application.
 * Organized by functionality area for better maintainability.
 */

// Form Management Hooks
export * from './form';

// Media Management Hooks  
export * from './media';

// Existing hooks (keep compatibility)
export { useAccessibility } from './useAccessibility';
export { useApiData } from './useApiData';
export { useAuthSession } from './useAuthSession';
export { useAutoSave } from './useAutoSave';
export { useDebounce } from './useDebounce';
export { useFavorites } from './useFavorites';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useLazyTranslation } from './useLazyTranslation';
export { useLocalStorage } from './useLocalStorage';
export { useResponsive } from './useResponsive';
export { useSearch } from './useSearch';
export { useThrottle } from './useThrottle';
export { useToggle } from './useToggle';
export { useWindowSize } from './useWindowSize';
