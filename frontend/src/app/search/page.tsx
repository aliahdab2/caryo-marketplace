"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { 
  MdClear, 
  MdTune,
  MdAdd,
  MdClose,
  MdDirectionsCar,
  MdFavoriteBorder
} from 'react-icons/md';
import { CarMake, CarModel } from '@/types/car';
import CarListingCard, { CarListingCardData } from '@/components/listings/CarListingCard';
import { 
  fetchCarBrands, 
  fetchCarModels,
  fetchCarReferenceData,
  fetchCarListings,
  fetchGovernorates,
  CarReferenceData,
  CarListing,
  PageResponse,
  CarListingFilterParams,
  Governorate
} from '@/services/api';
import { useApiData } from '@/hooks/useApiData';

interface AdvancedSearchFilters {
  // Basic filters matching backend ListingFilterRequest
  brand?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  
  // Location filters
  location?: string;
  locationId?: number;
  
  // Entity ID filters (for dropdown selections)
  conditionId?: number;
  transmissionId?: number;
  fuelTypeId?: number;
  bodyStyleId?: number;
  
  // Direct field filters
  exteriorColor?: string;
  doors?: number;
  cylinders?: number;
}

type FilterType = 'makeModel' | 'price' | 'year' | 'mileage' | 'transmission' | 'condition' | 'fuelType' | 'bodyStyle' | 'location';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i);

export default function AdvancedSearchPage() {
  const { t, i18n } = useTranslation(['common', 'search']);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [selectedMake, setSelectedMake] = useState<number | null>(null);
  const [activeFilterModal, setActiveFilterModal] = useState<FilterType | null>(null);

  // Car listings state
  const [carListings, setCarListings] = useState<PageResponse<CarListing> | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  // API data hooks
  const {
    data: carMakes = [],
    isLoading: isLoadingBrands,
    error: brandsError
  } = useApiData<CarMake[]>(
    fetchCarBrands,
    '/api/reference-data/brands',
    [t]
  );

  const {
    data: availableModels = [],
    isLoading: isLoadingModels,
    error: modelsError
  } = useApiData<CarModel[]>(
    () => selectedMake ? fetchCarModels(selectedMake) : Promise.resolve([]),
    selectedMake ? `/api/reference-data/brands/${selectedMake}/models` : '',
    [selectedMake, t],
    selectedMake ? { makeId: selectedMake } : undefined
  );

  const {
    data: referenceData,
    isLoading: isLoadingReferenceData,
    error: referenceDataError
  } = useApiData<CarReferenceData>(
    fetchCarReferenceData,
    '/api/reference-data',
    [t]
  );

  const {
    data: governorates = [],
    isLoading: isLoadingGovernorates,
    error: _governoratesError
  } = useApiData<Governorate[]>(
    fetchGovernorates,
    '/api/reference-data/governorates',
    [t]
  );

  // Get display name based on current language
  const getDisplayName = useCallback((item: { displayNameEn: string; displayNameAr: string }) => {
    return i18n.language === 'ar' ? item.displayNameAr : item.displayNameEn;
  }, [i18n.language]);

  // Helper functions to get display names for reference data
  const getConditionDisplayName = useCallback((id: number): string => {
    const condition = referenceData?.carConditions?.find(c => c.id === id);
    return condition ? getDisplayName(condition) : '';
  }, [referenceData, getDisplayName]);

  const getTransmissionDisplayName = useCallback((id: number): string => {
    const transmission = referenceData?.transmissions?.find(t => t.id === id);
    return transmission ? getDisplayName(transmission) : '';
  }, [referenceData, getDisplayName]);

  const getFuelTypeDisplayName = useCallback((id: number): string => {
    const fuelType = referenceData?.fuelTypes?.find(f => f.id === id);
    return fuelType ? getDisplayName(fuelType) : '';
  }, [referenceData, getDisplayName]);

  const getBodyStyleDisplayName = useCallback((id: number): string => {
    const bodyStyle = referenceData?.bodyStyles?.find(b => b.id === id);
    return bodyStyle ? getDisplayName(bodyStyle) : '';
  }, [referenceData, getDisplayName]);

  const getLocationDisplayName = useCallback((locationId: number): string => {
    const governorate = governorates?.find(g => g.id === locationId);
    return governorate ? getDisplayName(governorate) : '';
  }, [governorates, getDisplayName]);

  // Initialize form from URL params (only on initial load)
  useEffect(() => {
    console.log('Initializing filters from URL params:', searchParams?.toString());
    const initialFilters: AdvancedSearchFilters = {};
    
    // Basic filters
    if (searchParams?.get('brand')) initialFilters.brand = searchParams.get('brand')!;
    if (searchParams?.get('model')) initialFilters.model = searchParams.get('model')!;
    if (searchParams?.get('minYear')) initialFilters.minYear = parseInt(searchParams.get('minYear')!);
    if (searchParams?.get('maxYear')) initialFilters.maxYear = parseInt(searchParams.get('maxYear')!);
    if (searchParams?.get('minPrice')) initialFilters.minPrice = parseFloat(searchParams.get('minPrice')!);
    if (searchParams?.get('maxPrice')) initialFilters.maxPrice = parseFloat(searchParams.get('maxPrice')!);
    if (searchParams?.get('minMileage')) initialFilters.minMileage = parseInt(searchParams.get('minMileage')!);
    if (searchParams?.get('maxMileage')) initialFilters.maxMileage = parseInt(searchParams.get('maxMileage')!);
    
    // Location filters
    if (searchParams?.get('location')) initialFilters.location = searchParams.get('location')!;
    if (searchParams?.get('locationId')) initialFilters.locationId = parseInt(searchParams.get('locationId')!);
    
    // Entity ID filters
    if (searchParams?.get('conditionId')) initialFilters.conditionId = parseInt(searchParams.get('conditionId')!);
    if (searchParams?.get('transmissionId')) initialFilters.transmissionId = parseInt(searchParams.get('transmissionId')!);
    if (searchParams?.get('fuelTypeId')) initialFilters.fuelTypeId = parseInt(searchParams.get('fuelTypeId')!);
    if (searchParams?.get('bodyStyleId')) initialFilters.bodyStyleId = parseInt(searchParams.get('bodyStyleId')!);
    if (searchParams?.get('exteriorColor')) initialFilters.exteriorColor = searchParams.get('exteriorColor')!;
    if (searchParams?.get('doors')) initialFilters.doors = parseInt(searchParams.get('doors')!);
    if (searchParams?.get('cylinders')) initialFilters.cylinders = parseInt(searchParams.get('cylinders')!);

    console.log('Setting initial filters:', initialFilters);
    setFilters(initialFilters);
  }, [searchParams]); // Remove carMakes and getDisplayName dependencies

  // Set selected make when carMakes loads and we have a brand filter
  useEffect(() => {
    if (filters.brand && carMakes && carMakes.length > 0) {
      const brand = carMakes.find(make => 
        getDisplayName(make).toLowerCase() === filters.brand?.toLowerCase()
      );
      if (brand) {
        console.log('Setting selected make:', brand);
        setSelectedMake(brand.id);
      }
    }
  }, [filters.brand, carMakes, getDisplayName]);

  // Handle input changes
  const handleInputChange = (field: keyof AdvancedSearchFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));

    // Reset model when brand changes
    if (field === 'brand') {
      setFilters(prev => ({
        ...prev,
        model: undefined
      }));
      
      const brand = carMakes?.find(make => 
        getDisplayName(make).toLowerCase() === value?.toString().toLowerCase()
      );
      setSelectedMake(brand ? brand.id : null);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSelectedMake(null);
  };

  // Handle search submission
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Add all non-empty filters to URL params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });

    // Update current page URL instead of navigating away
    const newUrl = `/search?${params.toString()}`;
    router.replace(newUrl);
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  // Get filter display text
  const getFilterDisplayText = (filterType: FilterType): string => {
    switch (filterType) {
      case 'makeModel':
        if (filters.brand && filters.model) return `${filters.brand} ${filters.model}`;
        if (filters.brand) return filters.brand;
        return t('search.makeAndModel', 'Make and model');
      case 'price':
        if (filters.minPrice && filters.maxPrice) return `£${filters.minPrice} - £${filters.maxPrice}`;
        if (filters.minPrice) return `${t('search.from', 'From')} £${filters.minPrice}`;
        if (filters.maxPrice) return `${t('search.upTo', 'Up to')} £${filters.maxPrice}`;
        return t('search.price', 'Price');
      case 'year':
        if (filters.minYear && filters.maxYear) return `${filters.minYear} - ${filters.maxYear}`;
        if (filters.minYear) return `${t('search.from', 'From')} ${filters.minYear}`;
        if (filters.maxYear) return `${t('search.upTo', 'Up to')} ${filters.maxYear}`;
        return t('search.year', 'Year');
      case 'mileage':
        if (filters.minMileage && filters.maxMileage) return `${filters.minMileage} - ${filters.maxMileage} ${t('search.miles', 'miles')}`;
        if (filters.minMileage) return `${t('search.from', 'From')} ${filters.minMileage} ${t('search.miles', 'miles')}`;
        if (filters.maxMileage) return `${t('search.upTo', 'Up to')} ${filters.maxMileage} ${t('search.miles', 'miles')}`;
        return t('search.mileage', 'Mileage');
      case 'transmission':
        return filters.transmissionId ? getTransmissionDisplayName(filters.transmissionId) : t('search.gearbox', 'Gearbox');
      case 'condition':
        return filters.conditionId ? getConditionDisplayName(filters.conditionId) : t('search.condition', 'Condition');
      case 'fuelType':
        return filters.fuelTypeId ? getFuelTypeDisplayName(filters.fuelTypeId) : t('search.fuelType', 'Fuel type');
      case 'bodyStyle':
        return filters.bodyStyleId ? getBodyStyleDisplayName(filters.bodyStyleId) : t('search.bodyStyle', 'Body style');
      case 'location':
        return filters.locationId ? getLocationDisplayName(filters.locationId) : t('search.location', 'Location');
      default:
        return '';
    }
  };

  // Check if filter has active values
  const isFilterActive = (filterType: FilterType): boolean => {
    switch (filterType) {
      case 'makeModel':
        return !!(filters.brand || filters.model);
      case 'price':
        return !!(filters.minPrice || filters.maxPrice);
      case 'year':
        return !!(filters.minYear || filters.maxYear);
      case 'mileage':
        return !!(filters.minMileage || filters.maxMileage);
      case 'transmission':
        return !!filters.transmissionId;
      case 'condition':
        return !!filters.conditionId;
      case 'fuelType':
        return !!filters.fuelTypeId;
      case 'bodyStyle':
        return !!filters.bodyStyleId;
      case 'location':
        return !!filters.locationId;
      default:
        return false;
    }
  };

  // Filter pill component
  const FilterPill = ({ filterType, onClick }: { filterType: FilterType; onClick: () => void }) => {
    const isActive = isFilterActive(filterType);
    const displayText = getFilterDisplayText(filterType);
    
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
          isActive
            ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <MdAdd className="mr-2 h-4 w-4" />
        {displayText}
      </button>
    );
  };

  // Modal component
  const FilterModal = ({ filterType, onClose }: { filterType: FilterType; onClose: () => void }) => {
    const renderModalContent = () => {
      switch (filterType) {
        case 'makeModel':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.make', 'Make')}</h3>
                <select
                  value={filters.brand || ''}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingBrands}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {carMakes?.map(make => (
                    <option key={make.id} value={getDisplayName(make)}>
                      {getDisplayName(make)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.model', 'Model')}</h3>
                <select
                  value={filters.model || ''}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!selectedMake || isLoadingModels}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {availableModels?.map(model => (
                    <option key={model.id} value={getDisplayName(model)}>
                      {getDisplayName(model)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'price':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.priceRange', 'Price range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.from', 'From')}</label>
                    <input
                      type="number"
                      value={filters.minPrice || ''}
                      onChange={(e) => handleInputChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <input
                      type="number"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );

        case 'year':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.yearRange', 'Year range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">From</label>
                    <select
                      value={filters.minYear || ''}
                      onChange={(e) => handleInputChange('minYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('search.any', 'Any')}</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <select
                      value={filters.maxYear || ''}
                      onChange={(e) => handleInputChange('maxYear', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('search.any', 'Any')}</option>
                      {YEARS.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );

        case 'mileage':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.mileageRange', 'Mileage range')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">From</label>
                    <input
                      type="number"
                      value={filters.minMileage || ''}
                      onChange={(e) => handleInputChange('minMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t('search.to', 'To')}</label>
                    <input
                      type="number"
                      value={filters.maxMileage || ''}
                      onChange={(e) => handleInputChange('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder={t('search.any', 'Any')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );

        case 'transmission':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.gearbox', 'Gearbox')}</h3>
                <select
                  value={filters.transmissionId || ''}
                  onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.transmissions?.map(transmission => (
                    <option key={transmission.id} value={transmission.id}>
                      {getDisplayName(transmission)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'condition':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.condition', 'Condition')}</h3>
                <select
                  value={filters.conditionId || ''}
                  onChange={(e) => handleInputChange('conditionId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.carConditions?.map(condition => (
                    <option key={condition.id} value={condition.id}>
                      {getDisplayName(condition)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'fuelType':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.fuelType', 'Fuel type')}</h3>
                <select
                  value={filters.fuelTypeId || ''}
                  onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.fuelTypes?.map(fuelType => (
                    <option key={fuelType.id} value={fuelType.id}>
                      {getDisplayName(fuelType)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'bodyStyle':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.bodyStyle', 'Body style')}</h3>
                <select
                  value={filters.bodyStyleId || ''}
                  onChange={(e) => handleInputChange('bodyStyleId', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingReferenceData}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {referenceData?.bodyStyles?.map(bodyStyle => (
                    <option key={bodyStyle.id} value={bodyStyle.id}>
                      {getDisplayName(bodyStyle)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        case 'location':
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search.location', 'Location')}</h3>
                <select
                  value={filters.locationId || ''}
                  onChange={(e) => {
                    const locationId = e.target.value ? parseInt(e.target.value) : undefined;
                    const selectedGovernorate = governorates?.find(gov => gov.id === locationId);
                    handleInputChange('locationId', locationId);
                    // Send the slug to the backend for location filtering (backend searches by slug)
                    handleInputChange('location', selectedGovernorate?.slug || undefined);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={isLoadingGovernorates}
                >
                  <option value="">{t('search.any', 'Any')}</option>
                  {governorates?.map(governorate => (
                    <option key={governorate.id} value={governorate.id}>
                      {getDisplayName(governorate)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
        <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center sm:items-start sm:pt-20 sm:p-0">
          {/* Extremely subtle overlay that barely affects background visibility */}
          <div className="fixed inset-0 bg-black/3 transition-opacity pointer-events-auto" onClick={onClose} />
          
          <div className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-100 pointer-events-auto">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <MdClose className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-3">
              {renderModalContent()}
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => {
                    // Clear this specific filter
                    switch (filterType) {
                      case 'makeModel':
                        handleInputChange('brand', undefined);
                        handleInputChange('model', undefined);
                        break;
                      case 'price':
                        handleInputChange('minPrice', undefined);
                        handleInputChange('maxPrice', undefined);
                        break;
                      case 'year':
                        handleInputChange('minYear', undefined);
                        handleInputChange('maxYear', undefined);
                        break;
                      case 'mileage':
                        handleInputChange('minMileage', undefined);
                        handleInputChange('maxMileage', undefined);
                        break;
                      case 'transmission':
                        handleInputChange('transmissionId', undefined);
                        break;
                      case 'condition':
                        handleInputChange('conditionId', undefined);
                        break;
                      case 'fuelType':
                        handleInputChange('fuelTypeId', undefined);
                        break;
                      case 'bodyStyle':
                        handleInputChange('bodyStyleId', undefined);
                        break;
                      case 'location':
                        handleInputChange('location', undefined);
                        handleInputChange('locationId', undefined);
                        break;
                    }
                  }}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  {t('search.clearAll', 'Clear all')}
                </button>
                
                <button
                  onClick={() => {
                    // Update URL with current filters when user applies them
                    handleSearch();
                    // Close the modal
                    onClose();
                  }}
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('search.apply', 'Apply')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch car listings
  const fetchListings = useCallback(async () => {
    setIsLoadingListings(true);
    setListingsError(null);
    
    try {
      // Convert filters to backend format
      const listingFilters: CarListingFilterParams = {
        brand: filters.brand,
        model: filters.model,
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minMileage: filters.minMileage,
        maxMileage: filters.maxMileage,
        location: filters.location,
        locationId: filters.locationId,
        size: 20, // Default page size
        page: 0, // Default to first page
        sort: 'createdAt,desc' // Default sort
      };

      console.log('Sending search filters:', listingFilters);
      const response = await fetchCarListings(listingFilters);
      setCarListings(response);
    } catch (error) {
      console.error('Error fetching car listings:', error);
      setListingsError(error instanceof Error ? error.message : 'Failed to fetch car listings');
    } finally {
      setIsLoadingListings(false);
    }
  }, [filters]);

  // Fetch listings when filters change, language changes, or on component mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Filter Pills Row - AutoTrader UK Style */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            <FilterPill filterType="makeModel" onClick={() => setActiveFilterModal('makeModel')} />
            <FilterPill filterType="location" onClick={() => setActiveFilterModal('location')} />
            <FilterPill filterType="price" onClick={() => setActiveFilterModal('price')} />
            <FilterPill filterType="year" onClick={() => setActiveFilterModal('year')} />
            <FilterPill filterType="mileage" onClick={() => setActiveFilterModal('mileage')} />
            <FilterPill filterType="transmission" onClick={() => setActiveFilterModal('transmission')} />
            <FilterPill filterType="condition" onClick={() => setActiveFilterModal('condition')} />
            <FilterPill filterType="fuelType" onClick={() => setActiveFilterModal('fuelType')} />
            <FilterPill filterType="bodyStyle" onClick={() => setActiveFilterModal('bodyStyle')} />
            
            {/* Filter and Sort Button */}
            <button
              onClick={() => {
                // Apply current filters by updating URL and fetching new results
                handleSearch();
              }}
              className="inline-flex items-center px-6 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <MdTune className="mr-2 h-4 w-4" />
              {t('search.filterAndSort', 'Filter and sort')}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {carListings?.totalElements ? `${carListings.totalElements.toLocaleString()} ${t('search.results', 'results')}` : t('search.loading', 'Loading...')}
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
              >
                <MdClear className="mr-1 h-4 w-4" />
                {t('search.clearAll', 'Clear all filters')}
              </button>
            )}
          </div>
          
          <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
            <MdFavoriteBorder className="mr-2 h-4 w-4" />
            {t('search.saveSearch', 'Save search')}
          </button>
        </div>

        {/* Car Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoadingListings ? (
            // Loading state
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-w-16 aspect-h-12 bg-gray-300 h-48"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-5 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : carListings && carListings.content.length > 0 ? (
            // Real car listings using reusable component
            carListings.content.map((listing) => {
              // Transform backend CarListing to CarListingCardData format
              const cardData: CarListingCardData = {
                id: listing.id,
                title: listing.title,
                price: listing.price,
                year: listing.modelYear,
                mileage: listing.mileage,
                transmission: listing.transmission,
                fuelType: listing.fuelType,
                createdAt: listing.createdAt,
                sellerUsername: listing.sellerUsername,
                governorateNameEn: listing.governorateNameEn,
                governorateNameAr: listing.governorateNameAr,
                media: listing.media?.map(m => ({
                  url: m.url,
                  isPrimary: m.isPrimary,
                  contentType: m.contentType
                }))
              };

              return (
                <CarListingCard
                  key={listing.id}
                  listing={cardData}
                  onFavoriteToggle={(isFavorite) => {
                    // Handle favorite toggle if needed
                    console.log(`Car ${listing.id} favorite toggled:`, isFavorite);
                  }}
                  initialFavorite={false}
                />
              );
            })
          ) : (
            // No results state
            <div className="col-span-full text-center py-12">
              <MdDirectionsCar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cars found</h3>
              <p className="text-gray-600">Try adjusting your search filters to see more results.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {carListings && carListings.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                disabled={carListings.page === 0}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {carListings.page + 1} of {carListings.totalPages}
              </span>
              <button
                disabled={carListings.last}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Results summary */}
        {carListings && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {carListings.content.length} of {carListings.totalElements} cars
          </div>
        )}

        {/* Modal */}
        {activeFilterModal && (
          <FilterModal 
            filterType={activeFilterModal} 
            onClose={() => setActiveFilterModal(null)} 
          />
        )}

        {/* Error States */}
        {(brandsError || modelsError || referenceDataError || listingsError) && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-400">
              {listingsError || t('search.loadingError', 'Error loading filter options. Please refresh the page.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
