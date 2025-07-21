import React from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';

interface LocationDropdownProps {
  filters: AdvancedSearchFilters;
  setFilters: (filters: AdvancedSearchFilters) => void;
  showLocationDropdown: boolean;
  setShowLocationDropdown: (show: boolean) => void;
  governorates?: Governorate[];
  currentLanguage: string;
  t: (key: string, fallback?: string, options?: { count?: number }) => string;
}

export default function LocationDropdown({
  filters,
  setFilters,
  showLocationDropdown,
  setShowLocationDropdown,
  governorates,
  currentLanguage,
  t
}: LocationDropdownProps) {
  const locationDropdownOptions = React.useMemo(() => {
    return governorates?.map(gov => ({
      id: gov.id,
      slug: gov.slug || gov.displayNameEn.toLowerCase().replace(/\s+/g, '-'),
      displayNameEn: gov.displayNameEn,
      displayNameAr: gov.displayNameAr
    })) || [];
  }, [governorates]);

  return (
    <div className="w-full sm:w-auto sm:min-w-[200px] md:w-56 relative location-dropdown-container">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          className={`group w-full px-4 py-3 text-base border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-left flex items-center justify-between font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
            showLocationDropdown
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/10'
              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
          }`}
          aria-label={t('locationFilterLabel', 'Filter by location')}
          aria-expanded={showLocationDropdown}
          aria-haspopup="listbox"
          id="location-filter-button"
        >
          <span className="truncate">
            {filters.locations && filters.locations.length > 0
              ? filters.locations.length === 1
                ? (() => {
                    // Find the governorate that matches the selected location
                    const selectedLocationSlug = filters.locations[0];
                    const selectedGov = governorates?.find(gov => 
                      (gov.slug || gov.displayNameEn.toLowerCase().replace(/\s+/g, '-')) === selectedLocationSlug
                    );
                    return selectedGov 
                      ? (currentLanguage === 'ar' ? selectedGov.displayNameAr : selectedGov.displayNameEn)
                      : selectedLocationSlug;
                  })()
                : t('locationsSelected', 'Locations selected', { count: filters.locations.length })
              : t('allLocations', 'All Governorates')
            }
          </span>
          <MdKeyboardArrowDown 
            className={`h-5 w-5 transition-all duration-300 group-hover:scale-105 ${
              showLocationDropdown ? 'rotate-180 text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
            }`} 
            aria-hidden="true"
          />
        </button>
        
        {/* Dropdown */}
        {showLocationDropdown && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 max-h-72 flex flex-col backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
            role="listbox"
            aria-labelledby="location-filter-button"
          >
            {/* Scrollable location list */}
            <div className="flex-1 overflow-y-auto p-2 max-h-56" role="group" aria-label={t('locationOptions', 'Location options')}>
              {/* Location Options */}
              {locationDropdownOptions.map((gov) => {
                const isSelected = filters.locations?.includes(gov.slug) || false;
                const locationValue = gov.slug;
                const locationDisplayName = currentLanguage === 'ar' ? gov.displayNameAr : gov.displayNameEn;
                
                return (
                  <label
                    key={gov.id}
                    className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const updatedFilters = { ...filters };
                        
                        if (e.target.checked) {
                          // Add location
                          updatedFilters.locations = [...(filters.locations || []), locationValue];

                        } else {
                          // Remove location
                          updatedFilters.locations = filters.locations?.filter(loc => loc !== locationValue) || [];
                          if (updatedFilters.locations.length === 0) {
                            delete updatedFilters.locations;
                          }

                        }
                        
                        setFilters(updatedFilters);
                        // Don't update URL or search immediately - wait for "Show" button
                      }}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-2 border-2 border-gray-300 rounded-md transition-all duration-200 group-hover:scale-105"
                      aria-describedby={`location-${gov.id}-label`}
                    />
                    <span 
                      className={`text-sm font-medium transition-colors ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                      id={`location-${gov.id}-label`}
                    >
                      {locationDisplayName}
                    </span>
                  </label>
                );
              })}
            </div>
            
            {/* Bottom buttons - Enhanced */}
            <div className="border-t-2 border-gray-100 dark:border-gray-700 p-3 flex gap-2 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
              <button
                onClick={() => {
                  const updatedFilters = { ...filters };
                  delete updatedFilters.locations;
                  setFilters(updatedFilters);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99]"
              >
                {t('clear', 'Clear')}
              </button>
              <button
                onClick={() => {
                  // Close the dropdown
                  setShowLocationDropdown(false);
                  
                  // The filters are already set by the checkboxes above
                  // The useEffect will handle updating the URL and triggering the search
                }}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99]"
              >
                {t('show', 'Show')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

LocationDropdown.displayName = 'LocationDropdown';
