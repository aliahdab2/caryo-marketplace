"use client";

import React, { useMemo } from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';

// Move year generation outside component for performance
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

interface YearRangeFilterProps {
  filters: AdvancedSearchFilters;
  onMinYearChange: (year: number | undefined) => void;
  onMaxYearChange: (year: number | undefined) => void;
}

const YearRangeFilter: React.FC<YearRangeFilterProps> = ({
  filters,
  onMinYearChange,
  onMaxYearChange
}) => {
  const { t } = useLazyTranslation(['common', 'search']);

  // Memoize filtered years to prevent recalculation on every render
  const maxYearOptions = useMemo(() => 
    YEARS.filter(year => !filters.minYear || year >= filters.minYear), 
    [filters.minYear]
  );

  const minYearOptions = useMemo(() => 
    YEARS.filter(year => !filters.maxYear || year <= filters.maxYear), 
    [filters.maxYear]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {t('search.yearRange', 'Year range')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              {t('search.from', 'From')}
            </label>
            <select
              value={filters.minYear || ''}
              onChange={(e) => onMinYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('search.any', 'Any')}</option>
              {minYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              {t('search.to', 'To')}
            </label>
            <select
              value={filters.maxYear || ''}
              onChange={(e) => onMaxYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('search.any', 'Any')}</option>
              {maxYearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

YearRangeFilter.displayName = 'YearRangeFilter';

export default YearRangeFilter;
