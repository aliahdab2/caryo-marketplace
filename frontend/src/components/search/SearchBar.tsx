import React from 'react';
import { MdClose, MdSearch } from 'react-icons/md';
import { AdvancedSearchFilters } from '@/hooks/useSearchFilters';
import { Governorate } from '@/services/api';
import LocationDropdown from './LocationDropdown';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchLoading: boolean;
  handleSearch: () => void;
  filters: AdvancedSearchFilters;
  setFilters: (filters: AdvancedSearchFilters) => void;
  showLocationDropdown: boolean;
  setShowLocationDropdown: (show: boolean) => void;
  governorates?: Governorate[];
  currentLanguage: string;
  t: (key: string, fallback?: string) => string;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  searchLoading,
  handleSearch,
  filters,
  setFilters,
  showLocationDropdown,
  setShowLocationDropdown,
  governorates,
  currentLanguage,
  t
}: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {/* Mobile-first layout */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3">
          {/* Text Search Input */}
          <div className="flex-1">
            <label htmlFor="car-search-input" className="sr-only">
              {t('searchLabel', 'Search for cars by make, model, or location')}
            </label>
            <div className="flex gap-2 sm:relative">
              <div className="flex-1 relative">
                <input
                  id="car-search-input"
                  type="text"
                  placeholder={t('placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className={`w-full py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    currentLanguage === 'ar' ? 'text-right dir-rtl pr-3 pl-3 sm:pl-28' : 'text-left pl-3 pr-3 sm:pr-28'
                  }`}
                  dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                  aria-label={t('searchLabel', 'Search for cars by make, model, or location')}
                  aria-describedby="search-help"
                />
                
                {/* Clear button when there's text */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                    }}
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1 z-10 ${
                      currentLanguage === 'ar' ? 'left-2 sm:left-20' : 'right-2 sm:right-20'
                    }`}
                    aria-label={t('clearSearch', 'Clear search')}
                  >
                    <MdClose className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              
              {/* Search Button - separate on mobile, inside on desktop */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  // Only execute search if there's actual content to search for
                  if (searchQuery.trim()) {
                    handleSearch();
                  }
                }}
                className={`
                  px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                  text-white rounded text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02]
                  min-w-[80px] touch-manipulation
                  sm:absolute sm:top-1 sm:bottom-1 sm:px-4 sm:text-xs sm:min-w-0 sm:hover:scale-100
                  ${currentLanguage === 'ar' ? 'sm:left-1 sm:rounded-md' : 'sm:right-1 sm:rounded-md'}
                `}
                aria-label={t('searchButton', 'Search for cars')}
              >
                {searchLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span className="sr-only">{t('searching', 'Searching...')}</span>
                  </>
                ) : (
                  <div className="flex items-center">
                    <MdSearch className="mr-1.5 h-4 w-4" />
                    <span className="whitespace-nowrap">{t('search', 'Search')}</span>
                  </div>
                )}
              </button>
              
              <div id="search-help" className="sr-only">
                {t('searchHelp', 'Enter car make, model, or location and press Enter or click Search button')}
              </div>
            </div>
          </div>
          
          {/* Multi-Location Filter */}
          <LocationDropdown
            filters={filters}
            setFilters={setFilters}
            showLocationDropdown={showLocationDropdown}
            setShowLocationDropdown={setShowLocationDropdown}
            governorates={governorates}
            currentLanguage={currentLanguage}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            t={t as any}
          />
        </div>
      </div>
    </div>
  );
}

SearchBar.displayName = 'SearchBar';
