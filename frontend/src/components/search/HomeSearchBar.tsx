"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

import { CarMake, CarModel } from '@/types/car';
import { 
  fetchCarBrands, 
  fetchCarModels, 
  fetchGovernorates, 
  Governorate
} from '@/services/api';
import { useApiData, useFormSelection } from '@/hooks/useApiData';

// Custom hook to handle select dropdown positioning for mobile
const useSelectDropdownFix = (selectRefs: React.RefObject<HTMLSelectElement>[]) => {
  useEffect(() => {
    if (window.innerWidth >= 640) return; // Only apply on mobile
    
    // Create a list to store cleanup functions
    const cleanupFunctions: (() => void)[] = [];
    
    // Apply focus handlers to all selects
    selectRefs.forEach(ref => {
      const select = ref.current;
      if (!select) return;
      
      // Focus handler to improve dropdown positioning
      const handleFocus = () => {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Get element positioning
        const rect = select.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        
        // If there's not enough space below for dropdown options
        if (spaceBelow < 200) {
          const scrollAmount = Math.min(rect.top - 20, 200 - spaceBelow + 20);
          if (scrollAmount > 0) {
            window.scrollBy({
              top: -scrollAmount,
              behavior: 'smooth'
            });
          }
        }
        
        // Give the browser a moment to update
        setTimeout(() => {
          // Find the closest container
          const parentContainer = select.closest('.hero-search-container');
          if (parentContainer) {
            // Position the parent container optimally
            parentContainer.scrollIntoView({ 
              block: 'center',
              behavior: 'smooth' 
            });
          }
          
          // Final positioning for optimal dropdown display
          setTimeout(() => {
            const updatedRect = select.getBoundingClientRect();
            const targetPosition = isIOS ? 120 : 150; // pixels from top
            const currentPosition = updatedRect.top;
            const adjustment = currentPosition - targetPosition;
            
            if (Math.abs(adjustment) > 20) {
              window.scrollBy({
                top: adjustment,
                behavior: 'smooth'
              });
            }
          }, 50);
        }, 50);
      };
      
      // Attach event listener
      select.addEventListener('focus', handleFocus);
      
      // Store cleanup function
      cleanupFunctions.push(() => {
        select.removeEventListener('focus', handleFocus);
      });
    });
    
    // Return cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [selectRefs]);
};

const HomeSearchBar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const currentLanguage = i18n.language;
  const containerRef = useRef<HTMLDivElement>(null);
  const brandSelectRef = useRef<HTMLSelectElement>(null);
  const modelSelectRef = useRef<HTMLSelectElement>(null);
  const govSelectRef = useRef<HTMLSelectElement>(null);
  
  // Apply the dropdown positioning fix
  useSelectDropdownFix([brandSelectRef, modelSelectRef, govSelectRef]);
  
  // Form selections with reset capabilities
  const [selectedMake, setSelectedMake] = useFormSelection<number | null>(null, []);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  
  // Reset model when make changes
  useEffect(() => {
    setSelectedModel(null);
  }, [selectedMake]);
  
  
  // Use API data hooks for fetching data with loading, error handling
  const {
    data: carMakes = [],
    isLoading: isLoadingBrands,
    error: brandsError,
    retry: retryLoadingBrands
  } = useApiData<CarMake[]>(
    fetchCarBrands,
    '/api/reference-data/brands',
    [t]
  );

  const {
    data: governorates = [],
    isLoading: isLoadingGovernorates,
    error: governoratesError,
    retry: retryLoadingGovernorates
  } = useApiData<Governorate[]>(
    fetchGovernorates,
    '/api/reference-data/governorates',
    [t]
  );

  const {
    data: availableModels = [],
    isLoading: isLoadingModels,
    error: modelsError,
    retry: retryLoadingModels
  } = useApiData<CarModel[]>(
    () => selectedMake ? fetchCarModels(selectedMake) : Promise.resolve([]),
    selectedMake ? `/api/reference-data/brands/${selectedMake}/models` : '',
    [selectedMake, t],
    selectedMake ? { makeId: selectedMake } : undefined
  );
  
  
  // Get display name based on current language
  const getDisplayName = useCallback((item: { displayNameEn: string; displayNameAr: string }) => {
    return currentLanguage === 'ar' ? item.displayNameAr : item.displayNameEn;
  }, [currentLanguage]);

  // Sort governorates by current language
  const sortedGovernorates = useMemo(() => {
    if (!governorates || governorates.length === 0) return [];
    
    return [...governorates].sort((a, b) => {
      const nameA = currentLanguage === 'ar' ? a.displayNameAr : a.displayNameEn;
      const nameB = currentLanguage === 'ar' ? b.displayNameAr : b.displayNameEn;
      return nameA.localeCompare(nameB, currentLanguage === 'ar' ? 'ar' : 'en');
    });
  }, [governorates, currentLanguage]);

  // Handle search form submission
  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    
    // NEW: AutoTrader UK style slug-based URLs
    // Add brand slugs if selected
    if (selectedMake !== null) {
      const selectedBrand = carMakes?.find(make => make.id === selectedMake);
      if (selectedBrand && selectedBrand.slug) {
        params.append('brandSlugs', selectedBrand.slug); // Multiple brand support: ?brandSlugs=toyota&brandSlugs=honda
      }
    }
    
    // Add model slugs if selected
    if (selectedModel !== null) {
      const selectedCarModel = availableModels?.find(model => model.id === selectedModel);
      if (selectedCarModel && selectedCarModel.slug) {
        params.append('modelSlugs', selectedCarModel.slug); // Multiple model support: ?modelSlugs=camry&modelSlugs=corolla
      }
    }
    
    // Build location parameters
    if (selectedGovernorate) {
      const selectedGov = governorates?.find(gov => gov.displayNameEn === selectedGovernorate);
      if (selectedGov) {
        // Send the slug to the backend for location filtering (backend searches by slug)
        if (selectedGov.slug) {
          params.append('location', selectedGov.slug);
        }
        params.append('locationId', selectedGov.id.toString());
      }
    }

    // Use replace instead of push to avoid history stacking on quick searches
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [selectedMake, selectedModel, selectedGovernorate, carMakes, availableModels, governorates, router]);

  // Create a debounced search function
  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="w-full" data-testid="search-container" ref={containerRef}>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg overflow-visible">
        <div className="p-3 xs:p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-3 xs:gap-y-4 sm:gap-y-6">
            {/* Brand Select */}
            <div className="h-12 flex items-center">
              {/* Label hidden as requested */}
              <label htmlFor="brand" className="sr-only">
                {t('search.selectBrand', 'Brand')}
              </label>
              <div className="relative w-full h-12">
                <select
                  id="brand"
                  ref={brandSelectRef}
                  value={selectedMake ?? ''}
                  onChange={(e) => setSelectedMake(e.target.value ? Number(e.target.value) : null)}
                  className="appearance-none block w-full h-12 pl-3 xs:pl-4 pr-8 xs:pr-10 py-2 xs:py-3 text-sm xs:text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 overflow-hidden text-ellipsis whitespace-nowrap mobile-select-dropdown select-fix"
                  disabled={isLoadingBrands}
                  aria-label={t('search.selectBrand', 'Select brand')}
                >
                  <option value="">{t('search.selectBrand', 'Any Brand')}</option>
                  {!isLoadingBrands && carMakes?.map((make) => (
                    <option key={make.id} value={make.id}>{getDisplayName(make)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 xs:pr-2 pointer-events-none">
                  <svg className="w-4 xs:w-5 h-4 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isLoadingBrands && (
                  <div className="absolute inset-y-0 right-6 xs:right-8 flex items-center pr-1 pointer-events-none" data-testid="brand-loading-spinner">
                    <div className="animate-spin h-3 xs:h-4 w-3 xs:w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Model Select */}
            <div className="h-12 flex items-center">
              {/* Label hidden as requested */}
              <label htmlFor="model" className="sr-only">
                {t('search.selectModel', 'Model')}
              </label>
              <div className="relative w-full h-12">
                <select
                  id="model"
                  ref={modelSelectRef}
                  value={selectedModel ?? ''}
                  onChange={(e) => setSelectedModel(e.target.value ? Number(e.target.value) : null)}
                  className="appearance-none block w-full h-12 pl-3 xs:pl-4 pr-8 xs:pr-10 py-2 xs:py-3 text-sm xs:text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 overflow-hidden text-ellipsis whitespace-nowrap mobile-select-dropdown select-fix"
                  disabled={!selectedMake || isLoadingModels}
                  aria-label={t('search.selectModel', 'Select model')}
                >
                  <option value="">
                    {t('search.selectModel', 'Any Model')}
                  </option>
                  {selectedMake && !isLoadingModels && availableModels?.map((model) => (
                    <option key={model.id} value={model.id}>{getDisplayName(model)}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 xs:pr-2 pointer-events-none">
                  <svg className="w-4 xs:w-5 h-4 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isLoadingModels && (
                  <div className="absolute inset-y-0 right-6 xs:right-8 flex items-center pr-1 pointer-events-none" data-testid="model-loading-spinner">
                    <div className="animate-spin h-3 xs:h-4 w-3 xs:w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Governorate Select */}
            <div className="h-12 flex items-center">
              {/* Label hidden as requested */}
              <label htmlFor="governorate" className="sr-only">
                {t('search.governorate', 'Governorate')}
              </label>
              <div className="relative w-full h-12">
                <select
                  id="governorate"
                  ref={govSelectRef}
                  value={selectedGovernorate}
                  onChange={(e) => setSelectedGovernorate(e.target.value)}
                  className="appearance-none block w-full h-12 pl-3 xs:pl-4 pr-8 xs:pr-10 py-2 xs:py-3 text-sm xs:text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800 overflow-hidden text-ellipsis whitespace-nowrap mobile-select-dropdown select-fix"
                  disabled={isLoadingGovernorates}
                  aria-label={t('search.selectGovernorate', 'Select governorate')}
                >
                  <option value="">{t('search.selectGovernorate', 'Any Governorate')}</option>
                  {!isLoadingGovernorates && sortedGovernorates.map((gov) => (
                    <option key={gov.id} value={gov.displayNameEn}>
                      {getDisplayName(gov)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 xs:pr-2 pointer-events-none">
                  <svg className="w-4 xs:w-5 h-4 xs:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isLoadingGovernorates && (
                  <div className="absolute inset-y-0 right-6 xs:right-8 flex items-center pr-1 pointer-events-none">
                    <div className="animate-spin h-3 xs:h-4 w-3 xs:w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="h-12 flex items-center md:col-span-2 lg:col-span-1">
              <button
                type="submit"
                onClick={handleSearch}
                className="w-full h-12 px-4 xs:px-6 bg-blue-600 text-white text-sm xs:text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap flex items-center justify-center"
                aria-label={t('search.searchButton', 'Search Cars')}
              >
                <svg 
                  className="w-4 xs:w-5 h-4 xs:h-5 mr-1.5 xs:mr-2 rtl:ml-1.5 rtl:xs:ml-2 rtl:mr-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                <span className="hidden xs:inline">{t('search.searchButton', 'Search Cars')}</span>
                <span className="xs:hidden">{t('search.search', 'Search')}</span>
              </button>
            </div>
          </div>

          {/* Error Handling */}
          {(brandsError || modelsError || governoratesError) && (
            <div className="mt-4 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/10 rounded-md">
              {brandsError && (
                <div className="flex items-center justify-between mb-2">
                  <span>{brandsError}</span>
                  <button
                    type="button"
                    onClick={retryLoadingBrands}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3 rtl:mr-3 rtl:ml-0"
                  >
                    {t('search.tryAgain', 'Try Again')}
                  </button>
                </div>
              )}
              
              {modelsError && (
                <div className="flex items-center justify-between mb-2">
                  <span>{modelsError}</span>
                  <button
                    type="button"
                    onClick={retryLoadingModels}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3 rtl:mr-3 rtl:ml-0"
                  >
                    {t('search.tryAgain', 'Try Again')}
                  </button>
                </div>
              )}
              
              {governoratesError && (
                <div className="flex items-center justify-between">
                  <span>{governoratesError}</span>
                  <button
                    type="button"
                    onClick={retryLoadingGovernorates}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium ml-3 rtl:mr-3 rtl:ml-0"
                  >
                    {t('search.tryAgain', 'Try Again')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeSearchBar;
