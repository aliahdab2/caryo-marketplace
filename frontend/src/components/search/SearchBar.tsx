"use client";

import React, { useRef, useEffect, useState } from 'react';
import { MdClose, MdSearch } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useAnnouncements } from '@/hooks/useAccessibility';
import { EnhancedLoadingState } from '@/components/ui/EnhancedUX';

// Move namespaces outside component to prevent recreation on every render
const SEARCH_NAMESPACES = ['common', 'search'];

interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
}

const SearchBar = React.memo<SearchBarProps>(({ 
  searchQuery, 
  onSearchQueryChange, 
  onSearch, 
  isLoading = false,
  className = "",
  placeholder,
  autoFocus = false,
  onFocus,
  onBlur,
  error,
  suggestions = [],
  onSuggestionSelect
}) => {
  const { t, i18n } = useLazyTranslation(SEARCH_NAMESPACES);
  const currentLanguage = i18n.language;
  
  // 🚀 UX Enhancement: Focus management and accessibility
  const { announce } = useAnnouncements();
  
  // Local state for UX enhancements
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🚀 UX Enhancement: Auto-focus when specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // 🚀 UX Enhancement: Announce search results
  useEffect(() => {
    if (!isLoading && searchQuery) {
      announce(t('search:searchCompleted', `Search completed for "${searchQuery}"`));
    }
  }, [isLoading, searchQuery, announce, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        onSuggestionSelect?.(suggestions[selectedSuggestionIndex]);
        setShowSuggestions(false);
      } else {
        onSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
    onFocus?.();
  };

  const handleBlur = (_e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
    onBlur?.();
  };

  const handleClearSearch = () => {
    onSearchQueryChange('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
    announce(t('search:searchCleared', 'Search cleared'));
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect?.(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-2 sm:relative">
        <div className="flex-1 relative">
        <label 
          htmlFor="car-search-input"
          className="sr-only"
        >
          {t('search:searchLabel', 'Search for cars by make, model, or location')}
        </label>          <input
            ref={inputRef}
            id="car-search-input"
            type="text"
            role="combobox"
            placeholder={placeholder || t('search:placeholder', 'Search for cars... (e.g. "Toyota Camry", "BMW X3", "تويوتا كامري")')}
            value={searchQuery}
            onChange={(e) => {
              onSearchQueryChange(e.target.value);
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full py-2.5 text-base border rounded-md transition-all duration-200 ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : isFocused 
                  ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-25' 
                  : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            } dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
              currentLanguage === 'ar' ? 'text-right dir-rtl pr-3 pl-3 sm:pl-40' : 'text-left pl-3 pr-3 sm:pr-40'
            }`}
            dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
            aria-label={t('search:searchLabel', 'Search for cars by make, model, or location')}
            aria-describedby={error ? "search-error" : "search-help"}
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions}
            aria-autocomplete="list"
            aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
            autoComplete="off"
          />
          
          {/* Clear button when there's text */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1 z-10 ${
                currentLanguage === 'ar' ? 'left-2 sm:left-20' : 'right-2 sm:right-20'
              }`}
              aria-label={t('search:clearSearch', 'Clear search')}
            >
              <MdClose className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        
        {/* Search Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              onSearch();
            }
          }}
          disabled={isLoading || !searchQuery.trim()}
          className={`
            px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed
            text-white rounded text-sm font-medium flex items-center justify-center transition-all duration-200 
            min-w-[80px] touch-manipulation
            sm:absolute sm:top-1 sm:bottom-1 sm:px-4 sm:text-xs sm:min-w-0
            ${currentLanguage === 'ar' ? 'sm:left-1 sm:rounded-md' : 'sm:right-1 sm:rounded-md'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
          aria-label={t('search:searchButton', 'Search for cars')}
        >
          {isLoading ? (
            <EnhancedLoadingState type="spinner" size="sm" className="p-0" />
          ) : (
            <div className="flex items-center">
              <MdSearch className="mr-1.5 h-4 w-4" aria-hidden="true" />
              <span className="whitespace-nowrap">{t('search:search', 'Search')}</span>
            </div>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div id="search-error" className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-label={t('search:suggestions', 'Search suggestions')}
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={selectedSuggestionIndex === index}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                selectedSuggestionIndex === index 
                  ? 'bg-blue-50 text-blue-800' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      
      <div id="search-help" className="sr-only">
        {t('search:searchHelp', 'Enter car make, model, or location and press Enter or click Search button. Use arrow keys to navigate suggestions.')}
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
