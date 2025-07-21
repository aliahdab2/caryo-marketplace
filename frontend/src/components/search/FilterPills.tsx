import React from 'react';
import { MdFilterList } from 'react-icons/md';
import { FilterType } from '@/hooks/useSearchFilters';

interface FilterPillsProps {
  setActiveFilterModal: (filterType: FilterType | 'allFilters') => void;
  isFilterActive: (filterType: FilterType) => boolean;
  getFilterDisplayText: (filterType: FilterType) => string;
  t: (key: string, fallback?: string) => string;
}

const FilterPill = React.memo(({ 
  filterType: _filterType, 
  onClick, 
  isActive, 
  displayText 
}: { 
  filterType: FilterType; 
  onClick: () => void;
  isActive: boolean;
  displayText: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-blue-800'
          : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
      aria-label={`Filter by ${displayText}`}
    >
      <span className="relative z-10 flex items-center">
        {displayText}
      </span>

      {/* Animated background for active state */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      )}
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
      </div>
    </button>
  );
});

FilterPill.displayName = 'FilterPill';

export default function FilterPills({
  setActiveFilterModal,
  isFilterActive,
  getFilterDisplayText,
  t
}: FilterPillsProps) {
  return (
    <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <div className="flex flex-col space-y-2">
        {/* Filter Pills Section */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap gap-2">
            {/* Show All Filters Button */}
            <button
              onClick={() => setActiveFilterModal('allFilters')}
              className="group relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
              aria-label="Show all filters"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <MdFilterList className="w-4 h-4" />
                <span>{t('showAllFilters', 'Show all filters')}</span>
              </span>

              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </div>
            </button>
            
            <FilterPill 
              filterType="makeModel" 
              onClick={() => setActiveFilterModal('makeModel')} 
              isActive={isFilterActive('makeModel')}
              displayText={getFilterDisplayText('makeModel')}
            />
            <FilterPill 
              filterType="price" 
              onClick={() => setActiveFilterModal('price')} 
              isActive={isFilterActive('price')}
              displayText={getFilterDisplayText('price')}
            />
            <FilterPill 
              filterType="year" 
              onClick={() => setActiveFilterModal('year')} 
              isActive={isFilterActive('year')}
              displayText={getFilterDisplayText('year')}
            />
            <FilterPill 
              filterType="mileage" 
              onClick={() => setActiveFilterModal('mileage')} 
              isActive={isFilterActive('mileage')}
              displayText={getFilterDisplayText('mileage')}
            />
            <FilterPill 
              filterType="transmission" 
              onClick={() => setActiveFilterModal('transmission')} 
              isActive={isFilterActive('transmission')}
              displayText={getFilterDisplayText('transmission')}
            />
            <FilterPill 
              filterType="fuelType" 
              onClick={() => setActiveFilterModal('fuelType')} 
              isActive={isFilterActive('fuelType')}
              displayText={getFilterDisplayText('fuelType')}
            />
            <FilterPill 
              filterType="bodyStyle" 
              onClick={() => setActiveFilterModal('bodyStyle')} 
              isActive={isFilterActive('bodyStyle')}
              displayText={getFilterDisplayText('bodyStyle')}
            />
            <FilterPill 
              filterType="sellerType" 
              onClick={() => setActiveFilterModal('sellerType')} 
              isActive={isFilterActive('sellerType')}
              displayText={getFilterDisplayText('sellerType')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

FilterPills.displayName = 'FilterPills';
