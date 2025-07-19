// Centralized exports for search filter components
export { default as MakeModelFilter } from './MakeModelFilter';
export { default as PriceRangeFilter } from './PriceRangeFilter';
export { default as YearRangeFilter } from './YearRangeFilter';

// Re-export common types
export type { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
