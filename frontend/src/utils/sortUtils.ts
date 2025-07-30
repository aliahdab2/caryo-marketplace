/**
 * Utility functions for handling sort operations
 */

/**
 * Map frontend sort values to backend API sort format
 * @param sort - The frontend sort value
 * @returns The backend API sort string
 */
export const getSortValue = (sort: string): string => {
  switch (sort) {
    case 'price_low':
      return 'price,asc';
    case 'price_high':
      return 'price,desc';
    case 'year_new':
      return 'modelYear,desc'; // Sort by actual model year
    case 'year_old':
      return 'modelYear,asc'; // Sort by actual model year
    case 'mileage_low':
      return 'createdAt,desc'; // Use createdAt as fallback for mileage sorting
    case 'mileage_high':
      return 'createdAt,asc'; // Use createdAt as fallback for mileage sorting
    case 'date_new':
    default:
      return 'createdAt,desc';
  }
};

/**
 * Get display text for a sort option
 * @param sort - The sort value
 * @param t - Translation function
 * @returns The display text for the sort option
 */
export const getSortDisplayText = (sort: string, t: (key: string, fallback: string) => string): string => {
  switch (sort) {
    case 'price_low':
      return t('sortPriceLow', 'Low to High');
    case 'price_high':
      return t('sortPriceHigh', 'High to Low');
    case 'year_new':
      return t('sortYearNew', 'Newest Year');
    case 'year_old':
      return t('sortYearOld', 'Oldest Year');
    case 'mileage_low':
      return t('sortMileageLow', 'Low Mileage First');
    case 'mileage_high':
      return t('sortMileageHigh', 'High Mileage First');
    case 'date_new':
    default:
      return t('sortDateNew', 'Recently Added');
  }
};

/**
 * Available sort options
 */
export const SORT_OPTIONS = [
  { value: 'price_low', label: 'sortPriceLow', fallback: 'Low to High' },
  { value: 'price_high', label: 'sortPriceHigh', fallback: 'High to Low' },
  { value: 'year_new', label: 'sortYearNew', fallback: 'Newest Year' },
  { value: 'year_old', label: 'sortYearOld', fallback: 'Oldest Year' },
  { value: 'mileage_low', label: 'sortMileageLow', fallback: 'Low Mileage First' },
  { value: 'mileage_high', label: 'sortMileageHigh', fallback: 'High Mileage First' },
  { value: 'date_new', label: 'sortDateNew', fallback: 'Recently Added' }
] as const;

/**
 * Default sort value
 */
export const DEFAULT_SORT = 'date_new'; 