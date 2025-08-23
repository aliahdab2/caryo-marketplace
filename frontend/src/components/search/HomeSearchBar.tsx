"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useListingCount } from '@/hooks/useListingCount';
import BrandSelect from './selects/BrandSelect';
import ModelSelect from './selects/ModelSelect';
import GovernorateSelect from './selects/GovernorateSelect';


// Homepage search bar with live count updates

const HomeSearchBar = React.memo(() => {
  const { t, i18n } = useTranslation('search');
  const router = useRouter();
  const currentLanguage = i18n.language;
  // Form selections with reset capabilities
  const [selectedMake, setSelectedMake] = useFormSelection<number | null>(null, []);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [selectedGovernorateSlug, setSelectedGovernorateSlug] = useState<string>('');
  
  
  // Use API data hooks for fetching data with loading, error handling
  const brandsApi = useApiData<CarMake[]>(
    fetchCarBrands,
    '/api/reference-data/brands',
    [t]
  ) || { data: null, isLoading: false, error: null, retry: async () => {} };
  const carMakes: CarMake[] = useMemo(() => brandsApi.data ?? [], [brandsApi.data]);
  const isLoadingBrands: boolean = brandsApi.isLoading ?? false;
  const brandsError: string | null = brandsApi.error ?? null;
  const retryLoadingBrands: () => Promise<void> = brandsApi.retry;

  const governoratesApi = useApiData<Governorate[]>(
    fetchGovernorates,
    '/api/reference-data/governorates',
    [t]
  ) || { data: null, isLoading: false, error: null, retry: async () => {} };
  const governorates: Governorate[] = useMemo(() => governoratesApi.data ?? [], [governoratesApi.data]);
  const isLoadingGovernorates: boolean = governoratesApi.isLoading ?? false;
  const governoratesError: string | null = governoratesApi.error ?? null;
  const retryLoadingGovernorates: () => Promise<void> = governoratesApi.retry;

  const modelsApi = useApiData<CarModel[]>(
    () => selectedMake ? fetchCarModels(selectedMake) : Promise.resolve([]),
    selectedMake ? `/api/reference-data/brands/${selectedMake}/models` : '',
    [selectedMake, t],
    selectedMake ? { makeId: selectedMake } : undefined
  ) || { data: null, isLoading: false, error: null, retry: async () => {} };
  const availableModels: CarModel[] = useMemo(() => modelsApi.data ?? [], [modelsApi.data]);
  const isLoadingModels: boolean = modelsApi.isLoading ?? false;
  const modelsError: string | null = modelsApi.error ?? null;
  const retryLoadingModels: () => Promise<void> = modelsApi.retry;
  
  


  // Resolve selected slugs for the counting API
  const selectedBrandSlug = useMemo(() => {
    if (selectedMake === null || !carMakes) return undefined;
    const brand = carMakes.find((m) => m.id === selectedMake);
    return brand?.slug || undefined;
  }, [selectedMake, carMakes]);

  const selectedModelSlug = useMemo(() => {
    if (selectedModel === null || !availableModels) return undefined;
    const model = availableModels.find((m) => m.id === selectedModel);
    return model?.slug || undefined;
  }, [selectedModel, availableModels]);

  // Sort governorates by current language
  const sortedGovernorates = useMemo(() => {
    if (!governorates || governorates.length === 0) return [];
    
    return [...governorates].sort((a, b) => {
      const nameA = currentLanguage === 'ar' ? a.displayNameAr : a.displayNameEn;
      const nameB = currentLanguage === 'ar' ? b.displayNameAr : b.displayNameEn;
      return nameA.localeCompare(nameB, currentLanguage === 'ar' ? 'ar' : 'en');
    });
  }, [governorates, currentLanguage]);

  const { count: listingsCount } = useListingCount({
    brands: selectedBrandSlug ? [selectedBrandSlug] : undefined,
    models: selectedModelSlug ? [selectedModelSlug] : undefined,
    locations: selectedGovernorateSlug ? [selectedGovernorateSlug] : undefined,
  });

  // Stable search button label to prevent size changes
  const searchButtonLabel = useMemo(() => {
    return t('searchButton', 'Search Cars');
  }, [t]);

  // Persistence removed

  // Handle search form submission
  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const params = new URLSearchParams();
    
    // Location first for SEO - local relevance is primary
    if (selectedGovernorateSlug) {
      params.append('location', selectedGovernorateSlug);
    }
    
    // NEW: AutoTrader UK style slug-based URLs
    // Add brand slugs if selected
    if (selectedMake !== null) {
      const selectedBrand = carMakes?.find(make => make.id === selectedMake);
      if (selectedBrand && selectedBrand.slug) {
        params.append('brand', selectedBrand.slug); // Multiple brand support: ?brand=toyota&brand=honda
      }
    }
    
    // Add model slugs if selected
    if (selectedModel !== null) {
      const selectedCarModel = availableModels?.find(model => model.id === selectedModel);
      if (selectedCarModel && selectedCarModel.slug) {
        params.append('model', selectedCarModel.slug); // Multiple model support: ?model=camry&model=corolla
      }
    }
    
    // Build location parameters - removed as location is now handled above

    // Use replace instead of push to avoid history stacking on quick searches
    const queryString = params.toString();
    const url = queryString ? `/search?${queryString}` : '/search';
    router.push(url, { scroll: false });
  }, [selectedMake, selectedModel, selectedGovernorateSlug, carMakes, availableModels, router]);

  // Create a debounced search function
  const debouncedSearch = useMemo(() => debounce(handleSearch, 500), [handleSearch]);

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="w-full" data-testid="search-container">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-lg overflow-visible">
        <div className="p-3 xs:p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-3 xs:gap-x-4 sm:gap-x-6 gap-y-3 xs:gap-y-4 sm:gap-y-6">
            {/* Brand Select */}
            <BrandSelect
              value={selectedMake}
              onChange={(next) => {
                // Clear model immediately when brand changes
                setSelectedModel(null);
                setSelectedMake(next);
              }}
              options={carMakes}
              isLoading={isLoadingBrands}
              currentLanguage={currentLanguage}
            />

            {/* Model Select */}
            <div className="overflow-anchor-none">
            <ModelSelect
              value={selectedModel}
              onChange={setSelectedModel}
              options={availableModels}
              isLoading={isLoadingModels}
              currentLanguage={currentLanguage}
              selectedMake={selectedMake}
            />
            </div>

            {/* Governorate Select */}
            <GovernorateSelect
              value={selectedGovernorateSlug}
              onChange={setSelectedGovernorateSlug}
              options={sortedGovernorates}
              isLoading={isLoadingGovernorates}
              currentLanguage={currentLanguage}
            />

            {/* Search Button */}
            <div className="h-12 flex items-center md:col-span-2 lg:col-span-1">
              <button
                type="submit"
                onClick={handleSearch}
                className="w-full h-12 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap flex items-center justify-center"
                aria-label={t('searchButton', 'Search Cars')}
              >
                <svg 
                  className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" 
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
                <span className="tabular-nums text-center" aria-live="polite">
                  {searchButtonLabel}
                </span>
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
                    {t('tryAgain', 'Try Again')}
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
                    {t('tryAgain', 'Try Again')}
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
                    {t('tryAgain', 'Try Again')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HomeSearchBar.displayName = 'HomeSearchBar';

export default HomeSearchBar;
