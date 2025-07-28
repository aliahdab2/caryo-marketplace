// Centralized exports for search filter components
export { default as MakeModelFilter } from './MakeModelFilter';
export { default as PriceRangeFilter } from './PriceRangeFilter';
export { default as YearRangeFilter } from './YearRangeFilter';
export { default as TransmissionFilter } from './TransmissionFilter';
export { default as BodyStyleFilter } from './BodyStyleFilter';
export { default as FuelTypeFilter } from './FuelTypeFilter';

// Re-export common types
export type { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
