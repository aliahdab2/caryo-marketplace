"use client";

import React from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';

interface PriceRangeFilterProps {
  filters: AdvancedSearchFilters;
  onMinPriceChange: (price: number | undefined) => void;
  onMaxPriceChange: (price: number | undefined) => void;
}

const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  filters,
  onMinPriceChange,
  onMaxPriceChange
}) => {
  const { t } = useLazyTranslation(['common', 'search']);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('search:priceRange', 'Price range')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              {t('search:from', 'From')}
            </label>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => onMinPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder={t('search:any', 'Any')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              {t('search:to', 'To')}
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => onMaxPriceChange(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder={t('search:any', 'Any')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="1000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

PriceRangeFilter.displayName = 'PriceRangeFilter';

export default PriceRangeFilter;
