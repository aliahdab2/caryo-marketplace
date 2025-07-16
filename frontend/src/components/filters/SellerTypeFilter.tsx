"use client";

import React, { useEffect, useState } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { getSellerTypeCounts, SellerTypeCounts } from '@/services/sellerTypes';
import { ListingFilters } from '@/types/listings';

interface SellerTypeFilterProps {
  filters: ListingFilters;
  onFilterChange: (sellerTypeId: number | undefined) => void;
  selectedSellerTypeId?: number;
  className?: string;
}

interface SellerTypeOption {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  count: number;
}

const SellerTypeFilter: React.FC<SellerTypeFilterProps> = ({
  filters,
  onFilterChange,
  selectedSellerTypeId,
  className = ""
}) => {
  const { t } = useLazyTranslation(['listings']);
  const [sellerTypeCounts, setSellerTypeCounts] = useState<SellerTypeCounts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define seller types with proper mappings
  // These should match the backend seller types
  const sellerTypeDefinitions: Record<string, { id: number; displayNameEn: string; displayNameAr: string }> = {
    'private': { id: 1, displayNameEn: 'Private Seller', displayNameAr: 'بائع خاص' },
    'dealer': { id: 2, displayNameEn: 'Dealer', displayNameAr: 'معرض سيارات' }
  };

  // Fetch seller type counts when filters change
  useEffect(() => {
    const fetchCounts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a copy of filters without sellerTypeId to get all counts
        const { sellerTypeId: _sellerTypeId, ...filtersWithoutSellerType } = filters;
        const counts = await getSellerTypeCounts(filtersWithoutSellerType);
        setSellerTypeCounts(counts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load seller type counts';
        setError(errorMessage);
        console.error('[SellerTypeFilter] Error fetching counts:', err);
        // Set empty counts on error
        setSellerTypeCounts({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [filters]);

  // Convert seller type counts to options
  const sellerTypeOptions: SellerTypeOption[] = Object.entries(sellerTypeDefinitions).map(([key, definition]) => ({
    id: definition.id,
    name: key,
    displayNameEn: definition.displayNameEn,
    displayNameAr: definition.displayNameAr,
    count: sellerTypeCounts[key] || 0
  }));

  // Handle seller type selection
  const handleSellerTypeClick = (sellerTypeId: number) => {
    if (selectedSellerTypeId === sellerTypeId) {
      // If already selected, deselect
      onFilterChange(undefined);
    } else {
      // Select new seller type
      onFilterChange(sellerTypeId);
    }
  };

  // Get display name based on locale (for now always English, but ready for i18n)
  const getDisplayName = (option: SellerTypeOption): string => {
    // In the future, you can add locale detection here
    // return locale === 'ar' ? option.displayNameAr : option.displayNameEn;
    return option.displayNameEn;
  };

  if (error) {
    return (
      <div className={`text-sm text-red-600 ${className}`}>
        {t('errors.sellerTypeCountsError', { defaultValue: 'Unable to load seller type counts' })}
      </div>
    );
  }

  return (
    <div className={`seller-type-filter ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
        {t('filters.sellerType', { defaultValue: 'Seller Type' })}
      </h3>
      
      <div className="space-y-2">
        {sellerTypeOptions.map((option) => {
          const isSelected = selectedSellerTypeId === option.id;
          const displayName = getDisplayName(option);
          const countText = isLoading ? '...' : option.count.toLocaleString();
          
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSellerTypeClick(option.id)}
              disabled={isLoading}
              className={`
                w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200
                border border-gray-200 dark:border-gray-700
                ${isSelected 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300' 
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-pressed={isSelected}
              aria-label={`${displayName} (${countText})`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {displayName}
                </span>
                <span className={`
                  text-xs px-2 py-1 rounded-full
                  ${isSelected 
                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {countText}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('common.loading', { defaultValue: 'Loading...' })}
        </div>
      )}

      {/* No results indicator */}
      {!isLoading && !error && Object.keys(sellerTypeCounts).length === 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {t('filters.noSellerTypes', { defaultValue: 'No seller types available' })}
        </div>
      )}
    </div>
  );
};

export default SellerTypeFilter;
