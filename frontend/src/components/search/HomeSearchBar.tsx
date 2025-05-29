"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
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

const HomeSearchBar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const router = useRouter();
  const currentLanguage = i18n.language;
  
  // Form selections with reset capabilities
  const [selectedMake, setSelectedMake] = useFormSelection<number | null>(null, []);
  const [selectedModel, setSelectedModel] = useFormSelection<number | null>(null, [selectedMake]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  
  // Track if models are being fetched to prevent shaking during transitions
  const [isTransitioningModels, setIsTransitioningModels] = useState(false);
  
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
  
  // Handle model loading transition to prevent shaking
  useEffect(() => {
    if (selectedMake && isLoadingModels) {
      setIsTransitioningModels(true);
    } else if (!isLoadingModels) {
      // Add a small delay to prevent rapid layout shifts
      const timeout = setTimeout(() => {
        setIsTransitioningModels(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [selectedMake, isLoadingModels]);
  
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
    
    // Show a transition state before navigation
    setIsTransitioningModels(true);
    
    const params = new URLSearchParams();
    
    // Build brand parameters
    if (selectedMake !== null) {
      const selectedBrand = carMakes?.find(make => make.id === selectedMake);
      if (selectedBrand) {
        // Use display name for filtering and human-readable URLs
        params.append('brand', getDisplayName(selectedBrand));
        // Add slug for SEO
        params.append('brandSlug', selectedBrand.slug);
      }
    }
    
    // Build model parameters
    if (selectedModel !== null) {
      const selectedCarModel = availableModels?.find(model => model.id === selectedModel);
      if (selectedCarModel) {
        // Use display name for filtering and human-readable URLs
        params.append('model', getDisplayName(selectedCarModel));
        // Add slug for SEO
        params.append('modelSlug', selectedCarModel.slug);
      }
    }
    
    // Build location parameters
    if (selectedGovernorate) {
      params.append('location', selectedGovernorate);
      
      const selectedGov = governorates?.find(gov => gov.displayNameEn === selectedGovernorate);
      if (selectedGov) {
        // Add slug for SEO
        params.append('locationSlug', selectedGov.slug);
      }
    }

    // Use replace instead of push to avoid history stacking on quick searches
    router.push(`/listings?${params.toString()}`, { scroll: false });
  }, [selectedMake, selectedModel, selectedGovernorate, carMakes, availableModels, governorates, getDisplayName, router, setIsTransitioningModels]);

  // Create a debounced search function
  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-4 sm:gap-y-6">
            {/* Brand Select */}
            <div>
              {/* Label hidden as requested */}
              <label htmlFor="brand" className="sr-only">
                {t('search.selectBrand', 'Brand')}
              </label>
              <div className="relative">
                <select
                  id="brand"
                  value={selectedMake ?? ''}
                  onChange={(e) => setSelectedMake(e.target.value ? Number(e.target.value) : null)}
                  className={`search-select block w-full h-12 pl-4 pr-10 py-3 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md ${
                    isLoadingBrands ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white disabled:cursor-not-allowed`}
                  disabled={isLoadingBrands}
                  aria-label={t('search.selectBrand', 'Select brand')}
                >
                  <option value="">{
                    isLoadingBrands 
                      ? t('search.loadingBrands', 'Loading brands...') 
                      : t('search.selectBrand', 'Select Brand')
                  }</option>
                  {!isLoadingBrands && carMakes?.map((make) => (
                    <option key={make.id} value={make.id}>{getDisplayName(make)}</option>
                  ))}
                </select>
                {isLoadingBrands && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Model Select */}
            <div>
              {/* Label hidden as requested */}
              <label htmlFor="model" className="sr-only">
                {t('search.selectModel', 'Model')}
              </label>
              <div className="relative">
                <select
                  id="model"
                  value={selectedModel ?? ''}
                  onChange={(e) => setSelectedModel(e.target.value ? Number(e.target.value) : null)}
                  className={`search-select block w-full h-12 pl-4 pr-10 py-3 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md ${
                    !selectedMake || isLoadingModels || isTransitioningModels 
                      ? 'bg-gray-50 dark:bg-gray-800' 
                      : 'bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white disabled:cursor-not-allowed`}
                  disabled={!selectedMake || isLoadingModels || isTransitioningModels}
                  aria-label={t('search.selectModel', 'Select model')}
                >
                  <option value="">
                    {!selectedMake
                      ? t('search.selectBrandFirst', 'Select brand first')
                      : isLoadingModels || isTransitioningModels 
                        ? t('search.loadingModels', 'Loading models...') 
                        : t('search.selectModel', 'Select Model')}
                  </option>
                  {selectedMake && !isLoadingModels && !isTransitioningModels && availableModels?.map((model) => (
                    <option key={model.id} value={model.id}>{getDisplayName(model)}</option>
                  ))}
                </select>
                {isLoadingModels && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Governorate Select */}
            <div>
              {/* Label hidden as requested */}
              <label htmlFor="governorate" className="sr-only">
                {t('search.governorate', 'Governorate')}
              </label>
              <div className="relative">
                <select
                  id="governorate"
                  value={selectedGovernorate}
                  onChange={(e) => setSelectedGovernorate(e.target.value)}
                  className={`search-select block w-full h-12 pl-4 pr-10 py-3 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md ${
                    isLoadingGovernorates 
                      ? 'bg-gray-50 dark:bg-gray-800' 
                      : 'bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white disabled:cursor-not-allowed`}
                  disabled={isLoadingGovernorates}
                  aria-label={t('search.selectGovernorate', 'Select governorate')}
                >
                  <option value="">{
                    isLoadingGovernorates
                      ? t('search.loadingGovernorates', 'Loading...')
                      : t('search.selectGovernorate', 'Governorate')
                  }</option>
                  {!isLoadingGovernorates && sortedGovernorates.map((gov) => (
                    <option key={gov.id} value={gov.displayNameEn}>
                      {getDisplayName(gov)}
                    </option>
                  ))}
                </select>
                {isLoadingGovernorates && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end md:col-span-2 lg:col-span-1">
              <button
                type="submit"
                className="w-full h-12 px-6 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap flex items-center justify-center"
                aria-label={t('search.searchButton', 'Search Cars')}
              >
                <svg 
                  className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" 
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
                {t('search.searchButton', 'Search Cars')}
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
    </form>
  );
};

export default HomeSearchBar;
