import React, { useCallback, useRef, useState, useEffect } from 'react';
import { CarMake, CarModel } from '@/types/car';
import { CarReferenceData, CarListing, PageResponse, fetchBrandCounts, fetchModelCounts } from '@/services/api';
import { SellerTypeCounts } from '@/types/sellerTypes';
import { BodyStyleCounts } from '@/hooks/useBodyStyleCounts';
import PriceSlider from '@/components/ui/PriceSlider';
import MileageSlider from '@/components/ui/MileageSlider';
import YearSlider from '@/components/ui/YearSlider';
import { getCarIcon } from '@/utils/carIcons';
import { AdvancedSearchFilters, FilterType } from '@/hooks/useSearchFilters';
import { DEFAULT_CURRENCY } from '@/utils/currency';

interface FilterModalProps {
  filterType: FilterType;
  onClose: () => void;
  filters: AdvancedSearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedSearchFilters>>;
  selectedMake: number | null;
  selectedModel: number | null;
  carMakes: CarMake[] | null;
  availableModels: CarModel[] | null;
  allModels?: CarModel[]; // New prop for all models
  isLoadingBrands: boolean;
  isLoadingModels: boolean;
  isLoadingAllModels?: boolean; // New prop for loading all models
  referenceData: CarReferenceData | null;
  isLoadingReferenceData: boolean;
  sellerTypeCounts: SellerTypeCounts;
  bodyStyleCounts: BodyStyleCounts;
  carListings: PageResponse<CarListing> | null;
  currentLanguage: string;
  isRTL: boolean;
  dirClass: string;
  t: (key: string, fallback?: string, options?: Record<string, unknown>) => string;
  updateFiltersAndState: (
    filterUpdates: Partial<AdvancedSearchFilters>,
    stateUpdates?: { selectedMake?: number | null; selectedModel?: number | null }
  ) => void;
  handleInputChange: (field: keyof AdvancedSearchFilters, value: string | number | string[] | number[] | undefined) => void;
  clearSpecificFilter: (filterType: FilterType) => void;
}

const MODAL_CLASSES = {
  OVERLAY: "fixed inset-0 z-50 overflow-y-auto pointer-events-none",
  CONTAINER: "flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-6",
  BACKDROP: "fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity pointer-events-auto",
  MODAL: "relative transform overflow-hidden rounded-2xl bg-white px-6 py-6 text-left shadow-2xl transition-all w-full max-w-lg border border-gray-100 pointer-events-auto",
  CLOSE_BUTTON: "rounded-full p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all",
  SEPARATOR: "border-t border-gray-200",
  BUTTON_CONTAINER: "flex gap-3 mt-6"
} as const;

const BUTTON_CLASSES = {
  CLEAR: "flex-none px-4 py-3 rounded-xl bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium",
  PRIMARY: "flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold shadow-sm"
} as const;

const FilterModal: React.FC<FilterModalProps> = ({
  filterType,
  onClose,
  filters,
  setFilters,
  selectedMake,
  selectedModel,
  carMakes,
  availableModels,
  allModels,
  isLoadingBrands,
  isLoadingModels,
  isLoadingAllModels,
  referenceData,
  isLoadingReferenceData,
  sellerTypeCounts,
  bodyStyleCounts,
  carListings,
  currentLanguage,
  t,
  updateFiltersAndState,
  handleInputChange,
  clearSpecificFilter
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  // Local state for modal
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [modelCounts, setModelCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  
  // State for managing collapsible sections in allFilters modal
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    makeModel: true,
    price: true,
    year: true,
    mileage: true,
    bodyStyle: true,
    transmission: true,
    fuelType: true,
    sellerType: true
  });

  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Collapsible section component
  const CollapsibleSection = ({ 
    title, 
    sectionName, 
    children, 
    icon 
  }: { 
    title: string; 
    sectionName: string; 
    children: React.ReactNode; 
    icon: React.ReactNode;
  }) => {
    const isCollapsed = collapsedSections[sectionName];
    
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(sectionName)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-5 h-5 text-gray-600">
              {icon}
            </div>
            <span className="font-medium text-gray-900">{title}</span>
          </div>
          <div className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isCollapsed ? 'rotate-0' : 'rotate-180'
          }`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
        } overflow-hidden`}>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const getModalTitle = (filterType: FilterType) => {
    switch (filterType) {
      case 'makeModel': return t('search:makeModel', 'Make & Model');
      case 'price': return t('search:priceRange', 'Price Range');
      case 'year': return t('search:yearRange', 'Year Range');
      case 'mileage': return t('search:mileageRange', 'Mileage Range');
      case 'transmission': return t('search:transmission', 'Transmission');
      case 'fuelType': return t('search:fuelType', 'Fuel Type');
      case 'bodyStyle': return t('search:bodyStyle', 'Body Style');
      case 'sellerType': return t('search:sellerType', 'Seller Type');
      case 'allFilters': return t('search:filterAndSort', 'Filter and sort');
      default: return '';
    }
  };

  // Stable price change handler to prevent infinite loops
  const handlePriceChange = useCallback((minPrice: number | undefined, maxPrice: number | undefined) => {
    setFilters(prev => ({
      ...prev,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined
    }));
  }, [setFilters]);

  const handleApplyFilters = () => {
    // The filters already contain the correct slugs, so we can use them directly
    const selectedBrandSlugs = filters.brands || [];
    const selectedModelSlugs = filters.models || [];
    
    updateFiltersAndState({
      brands: selectedBrandSlugs.length > 0 ? selectedBrandSlugs : undefined,
      models: selectedModelSlugs.length > 0 ? selectedModelSlugs : undefined
    });
    
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({});
    updateFiltersAndState(
      { brands: [], models: [] },
      { selectedMake: null, selectedModel: null }
    );
  };

  // Toggle brand expansion to show/hide models
  const toggleBrandExpansion = (brandId: number) => {
    setExpandedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  // Fetch brand and model counts when modal opens
  useEffect(() => {
    if (filterType === 'makeModel') {
      const fetchCounts = async () => {
        setIsLoadingCounts(true);
        try {
          const [brands, models] = await Promise.all([
            fetchBrandCounts(),
            fetchModelCounts()
          ]);
          setBrandCounts(brands);
          setModelCounts(models);
        } catch (error) {
          console.error('Error fetching counts:', error);
        } finally {
          setIsLoadingCounts(false);
        }
      };
      
      fetchCounts();
    }
  }, [filterType]);



  const renderModalContent = () => {
    switch (filterType) {
      case 'makeModel': {
        // Use allModels if available, otherwise fall back to availableModels
        const modelsToUse = allModels || availableModels || [];
        
        // Filter brands and models based on search query
        const filteredBrands = (carMakes || []).map(brand => {
          // Filter models for this brand
          const brandModels = modelsToUse.filter(model => model.brand?.id === brand.id);
          let showBrand = false;
          let filteredModels = brandModels;
          if (searchQuery) {
            // Check if brand matches in either English or Arabic
            const brandMatchesEn = brand.displayNameEn.toLowerCase().includes(searchQuery.toLowerCase());
            const brandMatchesAr = brand.displayNameAr.includes(searchQuery);
            
            if (brandMatchesEn || brandMatchesAr) {
              showBrand = true;
            } else {
              // Otherwise, only show models that match in either language
              filteredModels = brandModels.filter(model => {
                const modelMatchesEn = model.displayNameEn.toLowerCase().includes(searchQuery.toLowerCase());
                const modelMatchesAr = model.displayNameAr.includes(searchQuery);
                return modelMatchesEn || modelMatchesAr;
              });
              if (filteredModels.length > 0) showBrand = true;
            }
          } else {
            showBrand = true;
          }
          return showBrand ? { ...brand, filteredModels } : null;
        }).filter(Boolean);

        // Helper to get display name
        const getBrandName = (brand: CarMake) => currentLanguage === 'ar' ? brand.displayNameAr : brand.displayNameEn;
        const getModelName = (model: CarModel) => currentLanguage === 'ar' ? model.displayNameAr : model.displayNameEn;

        // Define chip interface
        interface Chip {
          type: 'brand' | 'model';
          id: number;
          label: string;
          brandId?: number;
          slug?: string; // Added for search query handling
        }

        // Chips: collect all selected brands and models from filters
        const chips: Chip[] = [];
        
        // Add brand chips from filters.brands
        if (filters.brands && filters.brands.length > 0) {
          filters.brands.forEach(brandSlug => {
            const brand = carMakes?.find(b => b.slug === brandSlug);
            if (brand) {
              chips.push({ 
                type: 'brand', 
                id: brand.id, 
                label: getBrandName(brand),
                slug: brandSlug
              });
            }
          });
        }
        
        // Add model chips from filters.models
        if (filters.models && filters.models.length > 0) {
          filters.models.forEach(modelSlug => {
            const model = modelsToUse.find(m => m.slug === modelSlug);
            if (model) {
              const modelName = getModelName(model);
              chips.push({ 
                type: 'model', 
                id: model.id, 
                label: modelName,
                brandId: model.brand?.id,
                slug: modelSlug
              });
            }
          });
        }

        // Remove chip handler
        const handleRemoveChip = (chip: Chip) => {
          if (chip.type === 'brand') {
            // Remove brand and all its associated models from filters
            const updatedBrands = filters.brands?.filter(b => b !== chip.slug) || [];
            
            // Find all models that belong to this brand and remove them
            const brandToRemove = carMakes?.find(b => b.slug === chip.slug);
            let updatedModels = filters.models || [];
            
            if (brandToRemove) {
              // Get all models that belong to this brand
              const brandModels = modelsToUse.filter(model => model.brand?.id === brandToRemove.id);
              const brandModelSlugs = brandModels.map(model => model.slug);
              
              // Remove all models that belong to this brand
              updatedModels = updatedModels.filter(modelSlug => !brandModelSlugs.includes(modelSlug));
            }
            
            updateFiltersAndState({ 
              brands: updatedBrands.length > 0 ? updatedBrands : undefined,
              models: updatedModels.length > 0 ? updatedModels : undefined
            });
          } else {
            // Remove model from filters
            const updatedModels = filters.models?.filter(m => m !== chip.slug) || [];
            updateFiltersAndState({ 
              models: updatedModels.length > 0 ? updatedModels : undefined
            });
          }
        };

        // Brand/model checkbox handlers
        const handleBrandCheckbox = (brand: CarMake) => {
          const isSelected = filters.brands?.includes(brand.slug) || false;
          const updatedBrands = filters.brands || [];
          
          if (isSelected) {
            // Remove brand and all its associated models
            const newBrands = updatedBrands.filter(b => b !== brand.slug);
            
            // Find all models that belong to this brand and remove them
            let updatedModels = filters.models || [];
            const brandModels = modelsToUse.filter(model => model.brand?.id === brand.id);
            const brandModelSlugs = brandModels.map(model => model.slug);
            
            // Remove all models that belong to this brand
            updatedModels = updatedModels.filter(modelSlug => !brandModelSlugs.includes(modelSlug));
            
            updateFiltersAndState({ 
              brands: newBrands.length > 0 ? newBrands : undefined,
              models: updatedModels.length > 0 ? updatedModels : undefined
            });
          } else {
            // Add brand
            updateFiltersAndState({ 
              brands: [...updatedBrands, brand.slug]
            });
          }
        };
        
        const handleModelCheckbox = (model: CarModel) => {
          const isSelected = filters.models?.includes(model.slug) || false;
          const updatedModels = filters.models || [];
          const updatedBrands = filters.brands || [];
          
          if (isSelected) {
            // Remove model
            const newModels = updatedModels.filter(m => m !== model.slug);
            updateFiltersAndState({ 
              models: newModels.length > 0 ? newModels : undefined
            });
          } else {
            // Add model and ensure brand is also added
            const newModels = [...updatedModels, model.slug];
            let newBrands = updatedBrands;
            
            // Add brand if it's not already selected
            if (model.brand && !updatedBrands.includes(model.brand.slug)) {
              newBrands = [...updatedBrands, model.brand.slug];
            }
            
            updateFiltersAndState({ 
              models: newModels,
              brands: newBrands.length > 0 ? newBrands : undefined
            });
          }
        };

        // Brand/model checked state
        const isBrandChecked = (brand: CarMake) => filters.brands?.includes(brand.slug) || false;
        const isModelChecked = (model: CarModel) => filters.models?.includes(model.slug) || false;

        return (
          <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={t('search:searchMakeModel', 'Search for make or model')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Chips Row */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {chips.map(chip => (
                  <span key={chip.type + chip.id} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm font-medium text-gray-800">
                    {chip.label}
                    <button
                      className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                      onClick={() => handleRemoveChip(chip)}
                      aria-label={t('search:remove', 'Remove')}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Brands and Models List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              {isLoadingBrands || isLoadingCounts || isLoadingAllModels ? (
                <div className="flex items-center justify-center py-8">
                  <div data-testid="loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No brands or models found' : 'No brands available'}
                </div>
              ) : (
                filteredBrands
                  .filter((brand): brand is CarMake & { filteredModels: CarModel[] } => brand !== null)
                  .map((brand) => (
                    <div key={brand.id}>
                      <div className="flex justify-between items-center p-2">
                        {/* Left side: Checkbox, Brand Name, Count */}
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            checked={isBrandChecked(brand)}
                            onChange={() => handleBrandCheckbox(brand)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-900">{getBrandName(brand)}</span>
                          <span className="text-sm text-gray-500">({brandCounts[brand.slug]?.toLocaleString() || 0})</span>
                        </div>
                        {/* Right side: Arrow or placeholder, always fixed width */}
                        <div className="flex items-center justify-center w-6 h-6">
                          {brand.filteredModels.length > 0 ? (
                            <button
                              onClick={() => toggleBrandExpansion(brand.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                              aria-label={expandedBrands.has(brand.id) ? 'Collapse models' : 'Expand models'}
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${expandedBrands.has(brand.id) ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      {/* Models under brand - only show when expanded */}
                      {expandedBrands.has(brand.id) && brand.filteredModels.length > 0 && (
                        <div className={currentLanguage === 'ar' ? 'mr-8 space-y-1' : 'ml-8 space-y-1'}>
                          {brand.filteredModels.map((model: CarModel) => (
                            <div key={model.id} className="flex items-center space-x-3 rtl:space-x-reverse p-2">
                              <input
                                type="checkbox"
                                checked={isModelChecked(model)}
                                onChange={() => handleModelCheckbox(model)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{getModelName(model)}</span>
                              <span className="text-xs text-gray-500">({modelCounts[model.slug]?.toLocaleString() || 0})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
            {/* Show All Brands Link - Only show when there are hidden brands */}
            {searchQuery && (
              <div className="text-center mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {t('search:showAllBrands', 'Show all brands')}
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'price':
        return (
          <div className="w-full [&_.range-slider]:pt-0 [&_.range-slider]:pb-0 [&_.range-slider_.grid]:mt-0">
            <PriceSlider
              minPrice={filters.minPrice}
              maxPrice={filters.maxPrice}
              currency={DEFAULT_CURRENCY}
              onChange={handlePriceChange}
              t={t}
              locale={currentLanguage}
              className="w-full"
            />
          </div>
        );

      case 'year':
        return (
          <div className="w-full [&_.range-slider]:pt-0 [&_.range-slider]:pb-0 [&_.range-slider_.grid]:mt-0">
            <YearSlider
              minYear={filters.minYear}
              maxYear={filters.maxYear}
              onChange={(min, max) => {
                updateFiltersAndState({
                  minYear: min,
                  maxYear: max
                });
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              locale={currentLanguage}
              className="w-full"
            />
          </div>
        );

      case 'mileage':
        return (
          <div className="w-full [&_.range-slider]:pt-0 [&_.range-slider]:pb-0 [&_.range-slider_.grid]:mt-0">
            <MileageSlider
              minMileage={filters.minMileage}
              maxMileage={filters.maxMileage}
              onChange={(min, max) => {
                updateFiltersAndState({
                  minMileage: min,
                  maxMileage: max
                });
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              t={t as any}
              locale={currentLanguage}
              className="w-full"
            />
          </div>
        );

              case 'transmission':
          return (
            <div className="w-full">
              <select
                value={filters.transmissionId || ''}
                onChange={(e) => handleInputChange('transmissionId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('any', 'Any')}</option>
                {referenceData?.transmissions?.map(transmission => (
                  <option key={transmission.id} value={transmission.id}>
                    {currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn}
                  </option>
                ))}
              </select>
            </div>
          );

              case 'fuelType':
          return (
            <div className="w-full">
              <select
                value={filters.fuelTypeId || ''}
                onChange={(e) => handleInputChange('fuelTypeId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={isLoadingReferenceData}
              >
                <option value="">{t('any', 'Any')}</option>
                {referenceData?.fuelTypes?.map(fuelType => (
                  <option key={fuelType.id} value={fuelType.id}>
                    {currentLanguage === 'ar' ? fuelType.displayNameAr : fuelType.displayNameEn}
                  </option>
                ))}
              </select>
            </div>
          );

              case 'bodyStyle':
          return (
            <div className="space-y-4">
              
            <div className="grid gap-3 max-h-96 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2">
              {referenceData?.bodyStyles?.map(bodyStyle => {
                const isSelected = filters.bodyType?.includes(bodyStyle.slug) || false;
                const displayName = currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn;
                const count = bodyStyleCounts[bodyStyle.name.toLowerCase()] || 0;
                
                return (
                  <div
                    key={bodyStyle.id}
                    className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      const currentBodyTypes = filters.bodyType || [];
                      const newBodyTypes = isSelected 
                        ? currentBodyTypes.filter(type => type !== bodyStyle.slug)
                        : [...currentBodyTypes, bodyStyle.slug];
                      
                      handleInputChange('bodyType', newBodyTypes.length > 0 ? newBodyTypes : undefined);
                    }}
                  >
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <div className="transition-transform group-hover:scale-105">
                        {/* Professional car silhouette icon - now self-centering */}
                        {getCarIcon(bodyStyle.name.toLowerCase())}
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <span className="text-gray-900 font-medium">{displayName}</span>
                        <span className="text-gray-500 text-sm">({count.toLocaleString()})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500 scale-110' 
                          : 'border-gray-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

              case 'sellerType':
          return (
            <div className="space-y-6">
            
            {/* Blocket Style Filter with Checkboxes */}
            <div className="space-y-2">
              {/* Individual Seller Type Checkboxes - Blocket styling with English/Arabic content */}
              {referenceData?.sellerTypes?.map(sellerType => {
                const id = sellerType.id as number;
                const typedSellerType = sellerType as { displayNameEn: string; displayNameAr: string; name: string };
                const isSelected = filters.sellerTypeIds?.includes(id) || false;
                
                // Use proper English and Arabic display names from the database
                const displayName = currentLanguage === 'ar' ? typedSellerType.displayNameAr : typedSellerType.displayNameEn;
                
                // Get count for this seller type from our counts data
                const count = sellerTypeCounts[typedSellerType.name] || 0;
                
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 rounded-md px-2"
                    onClick={() => {
                      const currentSellerTypes = filters.sellerTypeIds || [];
                      const newSellerTypes = isSelected 
                        ? currentSellerTypes.filter(sellerTypeId => sellerTypeId !== id)
                        : [...currentSellerTypes, id];
                      
                      handleInputChange('sellerTypeIds', newSellerTypes.length > 0 ? newSellerTypes : undefined);
                    }}
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {/* Blocket-style Checkbox */}
                      <div className={`w-5 h-5 border-2 rounded transition-all ${
                        isSelected 
                          ? 'border-gray-400 bg-gray-400' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                      
                      {/* Label with Count - Blocket Style with English/Arabic */}
                      <label className="text-gray-900 cursor-pointer text-base font-normal">
                        {displayName} <span className="text-gray-500 font-normal">({count.toLocaleString()})</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'allFilters':
        return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* Make and Model */}
            <CollapsibleSection
              title={t('makeAndModel', 'Make and Model')}
              sectionName="makeModel"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('make', 'Make')}</label>
                  <select
                    value={selectedMake || ''}
                    onChange={(e) => {
                      const makeId = e.target.value ? Number(e.target.value) : null;
                      if (selectedMake !== makeId) {
                        if (makeId && carMakes) {
                          const brand = carMakes.find(make => make.id === makeId);
                          if (brand && brand.slug) {
                            updateFiltersAndState(
                              { brands: [brand.slug], models: [] },
                              { selectedMake: makeId, selectedModel: null }
                            );
                          }
                        } else {
                          updateFiltersAndState(
                            { brands: [], models: [] },
                            { selectedMake: null, selectedModel: null }
                          );
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={isLoadingBrands}
                  >
                    <option value="">{t('any', 'Any')}</option>
                    {carMakes?.map(make => (
                      <option key={make.id} value={make.id}>
                        {currentLanguage === 'ar' ? make.displayNameAr : make.displayNameEn}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">{t('model', 'Model')}</label>
                  <select
                    value={selectedModel || ''}
                    onChange={(e) => {
                      const modelId = e.target.value ? Number(e.target.value) : null;
                      if (selectedModel !== modelId) {
                        if (modelId && availableModels) {
                          const model = availableModels.find(m => m.id === modelId);
                          if (model && model.slug) {
                            updateFiltersAndState(
                              { models: [model.slug] },
                              { selectedModel: modelId }
                            );
                          }
                        } else {
                          updateFiltersAndState(
                            { models: [] },
                            { selectedModel: null }
                          );
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={!selectedMake || isLoadingModels}
                  >
                    <option value="">{t('any', 'Any')}</option>
                    {availableModels?.map(model => (
                      <option key={model.id} value={model.id}>
                        {currentLanguage === 'ar' ? model.displayNameAr : model.displayNameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CollapsibleSection>
            
            {/* Price Range */}
            <CollapsibleSection
              title={t('priceRange', 'Price Range')}
              sectionName="price"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            >
              <PriceSlider
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                currency={DEFAULT_CURRENCY}
                onChange={handlePriceChange}
                t={t}
                locale={currentLanguage}
                className="mb-2"
              />
            </CollapsibleSection>
            
            {/* Year Range */}
            <CollapsibleSection
              title={t('yearRange', 'Year Range')}
              sectionName="year"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            >
              <YearSlider
                minYear={filters.minYear}
                maxYear={filters.maxYear}
                onChange={(min, max) => {
                  updateFiltersAndState({
                    minYear: min,
                    maxYear: max
                  });
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                t={t as any}
                locale={currentLanguage}
                className="w-full"
              />
            </CollapsibleSection>
            
            {/* Mileage Range */}
            <CollapsibleSection
              title={t('mileageRange', 'Mileage Range')}
              sectionName="mileage"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            >
              <MileageSlider
                minMileage={filters.minMileage}
                maxMileage={filters.maxMileage}
                onChange={(min, max) => {
                  updateFiltersAndState({
                    minMileage: min,
                    maxMileage: max
                  });
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                t={t as any}
                locale={currentLanguage}
                className="w-full"
              />
            </CollapsibleSection>
            
            {/* Body Style */}
            <CollapsibleSection
              title={t('bodyStyle', 'Body Style')}
              sectionName="bodyStyle"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            >
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {referenceData?.bodyStyles?.map(bodyStyle => {
                  const isSelected = filters.bodyType?.includes(bodyStyle.slug) || false;
                  const displayName = currentLanguage === 'ar' ? bodyStyle.displayNameAr : bodyStyle.displayNameEn;
                  const count = bodyStyleCounts[bodyStyle.name.toLowerCase()] || 0;
                  
                  return (
                    <div
                      key={bodyStyle.id}
                      className={`group relative flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                      }`}
                      onClick={() => {
                                              const currentBodyTypes = filters.bodyType || [];
                      const newBodyTypes = isSelected
                        ? currentBodyTypes.filter(type => type !== bodyStyle.slug)
                        : [...currentBodyTypes, bodyStyle.slug];
                      
                      handleInputChange('bodyType', newBodyTypes.length > 0 ? newBodyTypes : undefined);
                      }}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className="transition-transform group-hover:scale-105">
                          {getCarIcon(bodyStyle.name.toLowerCase(), "w-8 h-8")}
                        </div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <span className="text-gray-900 font-medium">{displayName}</span>
                          <span className="text-gray-500 text-sm">({count.toLocaleString()})</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500 scale-110' 
                            : 'border-gray-300 group-hover:border-blue-400'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none animate-pulse"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={MODAL_CLASSES.OVERLAY}>
      <div className={MODAL_CLASSES.CONTAINER}>
        <div className={MODAL_CLASSES.BACKDROP} onClick={onClose} />
        
        <div 
          ref={modalRef}
          className={`${MODAL_CLASSES.MODAL} max-h-[90vh] overflow-hidden flex flex-col`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-modal-title"
          dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 id="filter-modal-title" className="text-xl font-semibold text-gray-900">
              {filterType === 'allFilters' 
                ? (currentLanguage === 'ar' ? 'تصفية وترتيب' : 'Filter and sort')
                : getModalTitle(filterType)
              }
            </h2>
            
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              onClick={onClose}
              aria-label={currentLanguage === 'ar' ? 'إغلاق نافذة التصفية' : 'Close filter modal'}
            >
              {currentLanguage === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          </div>

          {/* Title Separator */}
          <div className="w-full h-px bg-gray-200 mb-4"></div>

          {/* Filter Content */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            {renderModalContent()}
          </div>

          {/* Footer */}
          <div className={MODAL_CLASSES.SEPARATOR} />
          <div className={MODAL_CLASSES.BUTTON_CONTAINER}>
            {filterType === 'makeModel' ? (
              <>
                <button
                  type="button"
                  className="flex-none px-4 py-3 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-medium"
                  onClick={handleClearFilters}
                >
                  {currentLanguage === 'ar' ? 'مسح' : 'Clear'}
                </button>
                <button
                  type="button"
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-semibold shadow-sm"
                  onClick={handleApplyFilters}
                >
                  {currentLanguage === 'ar' 
                    ? `عرض ${carListings?.totalElements || 0} نتيجة` 
                    : `Show ${carListings?.totalElements || 0} results`
                  }
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={BUTTON_CLASSES.CLEAR}
                  onClick={() => {
                    if (filterType === 'allFilters') {
                      // Clear all filters for the "Show all filters" modal
                      setFilters({});
                      updateFiltersAndState(
                        {
                          brands: undefined,
                          models: undefined,
                          minPrice: undefined,
                          maxPrice: undefined,
                          minYear: undefined,
                          maxYear: undefined,
                          minMileage: undefined,
                          maxMileage: undefined,
                          transmissionId: undefined,
                          fuelTypeId: undefined,
                          bodyType: undefined,
                          sellerTypeIds: undefined,
                          locations: undefined,
                          conditionId: undefined,
                          exteriorColor: undefined,
                          doors: undefined,
                          cylinders: undefined
                        },
                        { selectedMake: null, selectedModel: null }
                      );
                    } else {
                      // Clear specific filter for individual modals
                      clearSpecificFilter(filterType);
                    }
                  }}
                  aria-label={currentLanguage === 'ar' ? `مسح تصفية ${getModalTitle(filterType)}` : `Clear ${getModalTitle(filterType)} filter`}
                >
                  {currentLanguage === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
                <button
                  type="button"
                  className={BUTTON_CLASSES.PRIMARY}
                  onClick={onClose}
                >
                  {currentLanguage === 'ar' ? 'البحث عن السيارات' : 'Search cars'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

FilterModal.displayName = 'FilterModal';

export default FilterModal;
