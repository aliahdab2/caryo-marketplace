"use client";

import React from 'react';
import { MdClose, MdSearch } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  className?: string;
}

const SearchBar = React.memo<SearchBarProps>(({ 
  searchQuery, 
  onSearchQueryChange, 
  onSearch, 
  isLoading = false,
  className = ""
}) => {
  const { t, i18n } = useLazyTranslation(SEARCH_NAMESPACES);
  const currentLanguage = i18n.language;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  };

  const handleClearSearch = () => {
    onSearchQueryChange('');
  };

  return (
    <div className={`flex gap-2 sm:relative ${className}`}>
      <div className="flex-1 relative">
        <label htmlFor="car-search-input" className="sr-only">
          {t('search.searchLabel', 'Search for cars by make, model, or location')}
        </label>
        <input
          id="car-search-input"
          type="text"
          placeholder={t('search:placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            currentLanguage === 'ar' ? 'text-right dir-rtl pr-3 pl-3 sm:pl-28' : 'text-left pl-3 pr-3 sm:pr-28'
          }`}
          dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
          aria-label={t('search.searchLabel', 'Search for cars by make, model, or location')}
          aria-describedby="search-help"
        />
        
        {/* Clear button when there's text */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1 z-10 ${
              currentLanguage === 'ar' ? 'left-2 sm:left-20' : 'right-2 sm:right-20'
            }`}
            aria-label={t('search.clearSearch', 'Clear search')}
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
            onSearch();
          }
        }}
        className={`
          px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          text-white rounded text-sm font-medium flex items-center justify-center transition-all duration-200 transform hover:scale-[1.02]
          min-w-[80px] touch-manipulation
          sm:absolute sm:top-1 sm:bottom-1 sm:px-4 sm:text-xs sm:min-w-0 sm:hover:scale-100
          ${currentLanguage === 'ar' ? 'sm:left-1 sm:rounded-md' : 'sm:right-1 sm:rounded-md'}
        `}
        aria-label={t('search.searchButton', 'Search for cars')}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            <span className="sr-only">{t('search.searching', 'Searching...')}</span>
          </>
        ) : (
          <div className="flex items-center">
            <MdSearch className="mr-1.5 h-4 w-4" />
            <span className="whitespace-nowrap">{t('search.search', 'Search')}</span>
          </div>
        )}
      </button>
      
      <div id="search-help" className="sr-only">
        {t('search.searchHelp', 'Enter car make, model, or location and press Enter or click Search button')}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
