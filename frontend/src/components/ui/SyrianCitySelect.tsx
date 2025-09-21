"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLocationsByCountry, Location } from '@/services/locations';

interface SyrianCitySelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  label?: string;
}

/**
 * City selection component for Syrian cities
 * Features:
 * - Database integration with Syrian cities
 * - Bilingual display (Arabic/English)
 * - Search functionality
 * - Governorate grouping
 * - Real-time loading states
 */
export default function SyrianCitySelect({
  id,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder = 'Select your city',
  className = '',
  label = 'City'
}: SyrianCitySelectProps) {
  const { t, i18n } = useTranslation('common');
  const [cities, setCities] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);

  // Load Syrian cities on mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const syrianCities = await getLocationsByCountry('SY');
        setCities(syrianCities.filter(city => city.active));
      } catch (error) {
        console.error('Failed to load Syrian cities:', error);
        // Fallback to empty array
        setCities([]);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  // Find selected city when value changes
  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find(c => c.displayNameEn === value || c.displayNameAr === value || c.slug === value);
      setSelectedCity(city || null);
    } else {
      setSelectedCity(null);
    }
  }, [value, cities]);

  // Filter cities based on search term
  const filteredCities = useMemo(() => {
    if (!searchTerm) return cities;

    const term = searchTerm.toLowerCase();
    return cities.filter(city =>
      city.displayNameEn.toLowerCase().includes(term) ||
      city.displayNameAr.toLowerCase().includes(term) ||
      (city.region && city.region.toLowerCase().includes(term))
    );
  }, [cities, searchTerm]);

  // Group cities by governorate
  const groupedCities = useMemo(() => {
    const groups: Record<string, Location[]> = {};

    filteredCities.forEach(city => {
      // Use governorate name from backend, fallback to region or 'Other'
      const governorate = (i18n.language === 'ar' ? city.governorateNameAr : city.governorateNameEn) 
        || city.region 
        || 'Other';
      if (!groups[governorate]) {
        groups[governorate] = [];
      }
      groups[governorate].push(city);
    });

    return groups;
  }, [filteredCities, i18n.language]);

  const handleCitySelect = (city: Location) => {
    const cityValue = i18n.language === 'ar' ? city.displayNameAr : city.displayNameEn;
    onChange(cityValue);
    setSelectedCity(city);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);

    // If user types something that matches a city exactly, select it
    const exactMatch = cities.find(city =>
      city.displayNameEn.toLowerCase() === inputValue.toLowerCase() ||
      city.displayNameAr.toLowerCase() === inputValue.toLowerCase()
    );

    if (exactMatch) {
      handleCitySelect(exactMatch);
    } else {
      // Clear selection if no exact match
      onChange(inputValue);
      setSelectedCity(null);
    }
  };

  const getDisplayName = (city: Location) => {
    return i18n.language === 'ar' ? city.displayNameAr : city.displayNameEn;
  };

  const getGovernorateName = (governorate: string) => {
    // This could be enhanced with proper governorate translations
    return governorate;
  };

  return (
    <div className={`group relative ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 transition-colors group-focus-within:text-orange-600 dark:group-focus-within:text-orange-400"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* City icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
            error
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800 group-focus-within:border-orange-300 dark:group-focus-within:border-orange-600 group-focus-within:shadow-md'
          }`}>
            <svg
              className={`w-5 h-5 transition-all duration-200 group-focus-within:scale-110 ${
                error ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>

        {/* Input field */}
        <input
          id={id}
          type="text"
          value={selectedCity ? getDisplayName(selectedCity) : searchTerm || value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow for selection
            setTimeout(() => setIsOpen(false), 200);
          }}
          disabled={disabled || loading}
          required={required}
          className={`block w-full pl-16 pr-10 py-3.5 border-2 rounded-xl shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-lg focus:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:ring-orange-500/20 focus:border-orange-500 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          placeholder={loading ? t('loadingCities', 'Loading cities...') : placeholder}
        />

        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filteredCities.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? t('noCitiesFound', 'No cities found') : t('noCities', 'No cities available')}
            </div>
          ) : (
            Object.entries(groupedCities).map(([governorate, governorateCities]) => (
              <div key={governorate}>
                {/* Governorate header */}
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-700">
                  {getGovernorateName(governorate)}
                </div>

                {/* Cities */}
                {governorateCities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {getDisplayName(city)}
                        </div>
                      </div>
                      {selectedCity?.id === city.id && (
                        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('loadingCities', 'Loading cities...')}
        </div>
      )}

    </div>
  );
}
