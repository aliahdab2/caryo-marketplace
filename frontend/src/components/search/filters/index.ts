// Centralized exports for search filter components
export { default as MakeModelFilter } from './MakeModelFilter';
export { default as TransmissionFilter } from './TransmissionFilter';
export { default as BodyStyleFilter } from './BodyStyleFilter';
export { default as FuelTypeFilter } from './FuelTypeFilter';
export { default as SellerTypeFilter } from './SellerTypeFilter';


// Re-export common types
export type { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
