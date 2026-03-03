import React from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';
import { TranslateFunction } from '@/types/i18n';

interface LocationDropdownProps {
  filters: AdvancedSearchFilters;
  setFilters: (filters: AdvancedSearchFilters) => void;
  showLocationDropdown: boolean;
  setShowLocationDropdown: (show: boolean) => void;
  governorates?: Governorate[];
  currentLanguage: string;
  t: TranslateFunction;
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
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 max-h-80 flex flex-col backdrop-blur-sm animate-in slide-in-from-top-2 duration-300"
            role="listbox"
            aria-labelledby="location-filter-button"
            dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
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
                    className={`group flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] mb-1 last:mb-0 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm'
                        : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 text-gray-700 dark:text-gray-300 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="relative">
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
                        className="sr-only"
                        aria-describedby={`location-${gov.id}-label`}
                      />
                      <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0 group-hover:scale-105 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 shadow-md'
                          : 'border-gray-300 dark:border-gray-500 group-hover:border-blue-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors flex-1 ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
                      }`}
                      id={`location-${gov.id}-label`}
                    >
                      {locationDisplayName}
                    </span>
                    {isSelected && (
                      <div className="ml-auto rtl:ml-0 rtl:mr-auto">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Bottom buttons - Enhanced */}
            <div className="border-t-2 border-gray-100 dark:border-gray-700 p-4 flex gap-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-b-xl">
              <button
                onClick={() => {
                  const updatedFilters = { ...filters };
                  delete updatedFilters.locations;
                  setFilters(updatedFilters);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md"
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
                className="flex-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.99]"
                style={{ flex: '2' }}
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
