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
    
    if (selectedMake !== null) {
      params.append('make', selectedMake.toString());
      
      // Find the make for display name
      const selectedBrand = carMakes?.find(make => make.id === selectedMake);
      if (selectedBrand) {
        params.append('makeName', getDisplayName(selectedBrand));
        // Also add the slug for SEO-friendly URLs
        params.append('makeSlug', selectedBrand.slug);
      }
    }
    
    if (selectedModel !== null) {
      params.append('model', selectedModel.toString());
      
      // Find the model for display name
      const selectedCarModel = availableModels?.find(model => model.id === selectedModel);
      if (selectedCarModel) {
        params.append('modelName', getDisplayName(selectedCarModel));
        // Also add the slug for SEO-friendly URLs
        params.append('modelSlug', selectedCarModel.slug);
      }
    }
    
    if (selectedGovernorate) {
      params.append('location', selectedGovernorate);
      
      // Find the governorate for additional data if needed
      const selectedGov = governorates?.find(gov => gov.displayNameEn === selectedGovernorate);
      if (selectedGov) {
        // Add slug for SEO-friendly URLs
        params.append('locationSlug', selectedGov.slug);
      }
    }

    router.push(`/listings?${params.toString()}`);
  }, [selectedMake, selectedModel, selectedGovernorate, carMakes, availableModels, governorates, getDisplayName, router]);

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
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
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
                  className="block w-full h-10 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  disabled={isLoadingBrands}
                  aria-label={t('search.selectBrand', 'Select brand')}
                >
                  <option value="">{t('search.selectBrand', 'Select Brand')}</option>
                  {carMakes?.map((make) => (
                    <option key={make.id} value={make.id}>{getDisplayName(make)}</option>
                  ))}
                </select>
                {isLoadingBrands && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('search.loadingBrands', 'Loading brands...')}
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
                  className="block w-full h-10 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  disabled={!selectedMake || isLoadingModels}
                  aria-label={t('search.selectModel', 'Select model')}
                >
                  <option value="">{t('search.selectModel', 'Select Model')}</option>
                  {availableModels?.map((model) => (
                    <option key={model.id} value={model.id}>{getDisplayName(model)}</option>
                  ))}
                </select>
                {isLoadingModels && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('search.loadingModels', 'Loading models...')}
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
                  className="block w-full h-10 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  disabled={isLoadingGovernorates}
                  aria-label={t('search.selectGovernorate', 'Select governorate')}
                >
                  <option value="">{t('search.selectGovernorate', 'Select Governorate')}</option>
                  {sortedGovernorates.map((gov) => (
                    <option key={gov.id} value={gov.displayNameEn}>
                      {getDisplayName(gov)}
                    </option>
                  ))}
                </select>
                {isLoadingGovernorates && (
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('search.loadingGovernorates', 'Loading governorates...')}
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-10 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                aria-label={t('search.searchButton', 'Search Cars')}
              >
                {t('search.searchButton', 'Search Cars')}
              </button>
            </div>
          </div>

          {/* Error Handling */}
          {brandsError && (
            <div className="mt-4 text-red-500 text-sm flex items-center justify-between bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
              <span>{brandsError}</span>
              <button
                type="button"
                onClick={retryLoadingBrands}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('search.tryAgain', 'Try Again')}
              </button>
            </div>
          )}
          
          {modelsError && (
            <div className="mt-4 text-red-500 text-sm flex items-center justify-between bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
              <span>{modelsError}</span>
              <button
                type="button"
                onClick={retryLoadingModels}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('search.tryAgain', 'Try Again')}
              </button>
            </div>
          )}
          
          {governoratesError && (
            <div className="mt-4 text-red-500 text-sm flex items-center justify-between bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
              <span>{governoratesError}</span>
              <button
                type="button"
                onClick={retryLoadingGovernorates}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {t('search.tryAgain', 'Try Again')}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default HomeSearchBar;
