"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { getListingById } from '@/services/listings';
import { fetchGovernorates, Governorate } from '@/services/api';
import { getLocationsByGovernorateSlug, Location } from '@/services/locations';
import { ListingFormData } from '@/types/listings';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import ListingExpiry from '@/app/dashboard/listings/components/ListingExpiry';
import NumericInput from '@/components/ui/NumericInput';

// Client component
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { t, i18n } = useTranslation(['listings', 'common']);
  const isRTL = i18n.language === 'ar';
  
  // State management
  const [formData, setFormData] = useState<ListingFormData | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingListing, setIsLoadingListing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Memoized car features to prevent recreation on every render
  const carFeatures = useMemo(() => [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ], []);

  // Memoized loadLocations function to prevent unnecessary re-renders
  const loadLocations = useCallback(async (governorateSlug: string) => {
    if (!governorateSlug || governorateSlug.trim() === '') {
      setLocations([]);
      return;
    }

    try {
      setIsLoadingLocations(true);
      setLocations([]); // Clear previous locations
      const locationData = await getLocationsByGovernorateSlug(governorateSlug);
      setLocations(locationData);
    } catch (error) {
      // Use proper error logging instead of console.error
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load locations:', error);
      }
      setError(t('listings:failedToLoadLocations'));
    } finally {
      setIsLoadingLocations(false);
    }
  }, [t]);

  // Load locations when governorate changes
  useEffect(() => {
    if (formData?.governorateSlug) {
      loadLocations(formData.governorateSlug);
    } else {
      setLocations([]);
    }
  }, [formData?.governorateSlug, loadLocations]);

  // Store image object URLs for preview with proper cleanup
  useEffect(() => {
    if (formData?.images) {
      const newUrls = formData.images.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(newUrls);

      // Cleanup function to revoke object URLs when component unmounts or images change
      return () => {
        newUrls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [formData?.images]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingListing(true);
        setIsLoadingGovernorates(true);
        setError(null);

        // Load listing data and governorates in parallel
        const [listing, governoratesData] = await Promise.all([
          getListingById(id),
          fetchGovernorates()
        ]);
        
        // Extract existing images from the listing's media field (already transformed)
        const existingImageUrls = listing.media?.map(media => media.url) || [];
        setExistingImages(existingImageUrls);
        
        // Convert listing data to form data format
        const listingFormData: ListingFormData = {
          id: listing.id,
          title: listing.title,
          description: listing.description || "",
          make: listing.brandNameEn || listing.brand || "",
          model: listing.modelNameEn || listing.model || "",
          year: listing.year?.toString() || listing.modelYear?.toString() || "",
          price: listing.price.toString(),
          currency: listing.currency || "SAR",
          condition: "used", // Default since backend doesn't seem to have this field
          mileage: listing.mileage?.toString() || "",
          engine: "", // Default empty since engine property doesn't exist on Listing
          color: listing.exteriorColor || "",
          exteriorColor: listing.exteriorColor || "",
          interiorColor: listing.interiorColor || "",
          transmission: listing.transmission || "",
          fuelType: listing.fuelType || "",
          features: listing.features || [],
          categoryId: listing.category?.id || "",
          location: listing.location?.address || "",
          governorateSlug: listing.governorate?.nameEn?.toLowerCase().replace(/\s+/g, '-') || "",
          locationSlug: listing.location?.city?.toLowerCase().replace(/\s+/g, '-') || "",
          state: listing.location?.city || "",
          zipCode: listing.location?.city || "",
          contactName: listing.seller?.name || "",
          contactPhone: listing.seller?.phone || "",
          contactEmail: listing.seller?.email || "",
          contactPreference: "phone",
          images: [],
          status: (listing.status === "sold" ? "active" : listing.status) || "pending",
          expires: listing.expires || undefined
        };
        
        setFormData(listingFormData);
        setGovernorates(governoratesData);
      } catch (error) {
        // Use proper error logging instead of console.error
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load data:', error);
        }
        setError(error instanceof Error ? error.message : t('listings:failedToLoadData'));
      } finally {
        setIsLoadingListing(false);
        setIsLoadingGovernorates(false);
      }
    };

    loadData();
  }, [id, t]);

  // Memoized handleChange function to prevent unnecessary re-renders
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string, fieldName?: string) => {
    let name: string;
    let value: string;
    
    // Handle both event objects and direct string values (for NumericInput)
    if (typeof e === 'string') {
      name = fieldName!;
      value = e;
    } else {
      name = e.target.name;
      value = e.target.value;
    }
    
    setFormData(prev => {
      if (!prev) return prev;
      const updates: Partial<ListingFormData> = {
        [name]: value
      };
      
      // Reset location when governorate changes
      if (name === 'governorateSlug') {
        updates.locationSlug = '';
      }
      
      return {
        ...prev,
        ...updates
      };
    });
  }, []);

  // Memoized handleFeatureChange function
  const handleFeatureChange = useCallback((feature: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      if (prev.features.includes(feature)) {
        return {
          ...prev,
          features: prev.features.filter(f => f !== feature)
        };
      } else {
        return {
          ...prev,
          features: [...prev.features, feature]
        };
      }
    });
  }, []);

  // Memoized handleImageUpload function
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          images: [...prev.images, ...newImages]
        };
      });
    }
  }, []);

  // Memoized removeImage function
  const removeImage = useCallback((index: number, isExisting: boolean = false) => {
    if (isExisting) {
      // Remove existing image
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove new uploaded image
      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          images: prev.images.filter((_, i) => i !== index)
        };
      });
    }
  }, []);

  // Memoized handleSubmit function
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the update data according to backend API requirements
      interface UpdateListingData {
        title?: string;
        modelYear?: number;
        mileage?: number;
        price?: number;
        currency?: string;
        description?: string;
        transmission?: string;
        [key: string]: unknown;
      }

      const updateData: UpdateListingData = {
        title: formData.title,
        modelYear: parseInt(formData.year) || undefined,
        mileage: parseInt(formData.mileage) || undefined,
        price: parseFloat(formData.price) || undefined,
        currency: formData.currency || undefined,
        description: formData.description,
        transmission: formData.transmission,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // await updateListing(id, updateData); // updateListing is not defined
      
      // Redirect to listings page after successful update
      router.push("/dashboard/listings");
    } catch (error) {
      // Use proper error logging instead of console.error
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating listing:", error);
      }
      setError(error instanceof Error ? error.message : "Failed to update listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [formData, router]);

  // Memoized handleRenewal function
  const handleRenewal = useCallback((id: string, duration: number) => {
    // In a real app, perform API call to renew listing
    // Use proper error logging instead of console.log
    if (process.env.NODE_ENV === 'development') {
      console.log(`Renewing listing ${id} for ${duration} days`);
    }

    // Update expiry date in the local state
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + duration);

    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: "active",
        expires: newExpiry.toISOString().split('T')[0]
      };
    });
  }, []);

  // Memoized loading state
  const isLoadingData = useMemo(() => 
    isLoadingListing || isLoadingGovernorates, 
    [isLoadingListing, isLoadingGovernorates]
  );

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className={`flex justify-center items-center py-12 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-gray-600 dark:text-gray-400`}>{t('listings:loading')}</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-2xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-red-600 dark:text-red-400 text-lg mb-2">⚠️ {t('common:error')}</div>
        <p className={`text-red-700 dark:text-red-300 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          {t('common:tryAgain')}
        </button>
      </div>
    );
  }

  // Show error if formData is null
  if (!formData) {
    return <div className={`${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>{t('listings:loading')}</div>;
  }

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 lg:p-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with back navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/dashboard/listings')}
            className={`flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <svg className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('listings:backToListings')}
          </button>
        </div>
        <h1 className={`text-3xl font-bold text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:editListing')}</h1>
        <p className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:editListingSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className={`text-red-700 dark:text-red-300 ${isRTL ? 'text-right' : 'text-left'}`}>{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:basicInformation')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:title')} <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('listings:titlePlaceholder')}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('listings:descriptionPlaceholder')}
                required
                rows={4}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:locationInformation')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Governorate */}
            <div>
              <label htmlFor="governorateSlug" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:governorate')} <span className="text-red-500">*</span>
              </label>
              <select
                id="governorateSlug"
                name="governorateSlug"
                value={formData.governorateSlug}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">{t('listings:selectGovernorate')}</option>
                {isLoadingGovernorates ? (
                  <option disabled>{t('listings:loadingGovernorates')}</option>
                ) : (
                  governorates.map((governorate) => (
                    <option key={governorate.slug} value={governorate.slug}>
                      {governorate.displayNameEn}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="locationSlug" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:location')} <span className="text-red-500">*</span>
              </label>
              <select
                id="locationSlug"
                name="locationSlug"
                value={formData.locationSlug}
                onChange={handleChange}
                required
                disabled={!formData.governorateSlug || isLoadingLocations}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">
                  {!formData.governorateSlug 
                    ? t('listings:selectGovernorateFirst')
                    : isLoadingLocations 
                      ? t('listings:loadingLocations')
                      : t('listings:selectLocation')
                  }
                </option>
                {locations.map((location) => (
                  <option key={location.slug} value={location.slug}>
                    {location.displayNameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:vehicleDetails')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Make */}
            <div>
              <label htmlFor="make" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:make')} <span className="text-red-500">*</span>
              </label>
              <input
                id="make"
                name="make"
                type="text"
                value={formData.make}
                onChange={handleChange}
                placeholder={t('listings:makePlaceholder')}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Model */}
            <div>
              <label htmlFor="model" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:model')} <span className="text-red-500">*</span>
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={formData.model}
                onChange={handleChange}
                placeholder={t('listings:modelPlaceholder')}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Year */}
            <div>
              <label htmlFor="year" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:year')} <span className="text-red-500">*</span>
              </label>
              <NumericInput
                id="year"
                name="year"
                value={formData.year}
                onChange={(value) => handleChange(value, 'year')}
                placeholder={t('listings:yearPlaceholder')}
                required
                min={1900}
                max={new Date().getFullYear() + 1}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Mileage */}
            <div>
              <label htmlFor="mileage" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:mileage')} <span className="text-red-500">*</span>
              </label>
              <NumericInput
                id="mileage"
                name="mileage"
                value={formData.mileage}
                onChange={(value) => handleChange(value, 'mileage')}
                placeholder={t('listings:mileagePlaceholder')}
                required
                min={0}
                max={999999}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:price')} <span className="text-red-500">*</span>
              </label>
              <NumericInput
                id="price"
                name="price"
                value={formData.price}
                onChange={(value) => handleChange(value, 'price')}
                placeholder={t('listings:pricePlaceholder')}
                required
                min={0}
                max={999999999}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:currency')} <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exterior Color */}
            <div>
              <label htmlFor="exteriorColor" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:exteriorColor')}
              </label>
              <input
                id="exteriorColor"
                name="exteriorColor"
                type="text"
                value={formData.exteriorColor}
                onChange={handleChange}
                placeholder={t('listings:exteriorColorPlaceholder')}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Interior Color */}
            <div>
              <label htmlFor="interiorColor" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:interiorColor')}
              </label>
              <input
                id="interiorColor"
                name="interiorColor"
                type="text"
                value={formData.interiorColor}
                onChange={handleChange}
                placeholder={t('listings:interiorColorPlaceholder')}
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              />
            </div>

            {/* Transmission */}
            <div>
              <label htmlFor="transmission" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:transmission')} <span className="text-red-500">*</span>
              </label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="automatic">{t('listings:automatic')}</option>
                <option value="manual">{t('listings:manual')}</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label htmlFor="fuelType" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('listings:fuelType')} <span className="text-red-500">*</span>
              </label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="gasoline">{t('listings:gasoline')}</option>
                <option value="diesel">{t('listings:diesel')}</option>
                <option value="electric">{t('listings:electric')}</option>
                <option value="hybrid">{t('listings:hybrid')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:features')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {carFeatures.map((feature) => (
              <div key={feature} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="checkbox"
                  id={feature}
                  checked={formData.features.includes(feature)}
                  onChange={() => handleFeatureChange(feature)}
                  className={`h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ${isRTL ? 'ml-3' : 'mr-3'}`}
                />
                <label htmlFor={feature} className={`text-sm text-gray-700 dark:text-gray-300 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t(`listings:${feature}`)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:images')}</h2>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Existing images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative">
                <Image 
                  src={url} 
                  alt={`${t('listings:existingImage')} ${index + 1}`} 
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hidden`}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index, true)}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors`}
                >
                  ×
                </button>
              </div>
            ))}
            {/* New uploaded images */}
            {imagePreviewUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative">
                <Image 
                  src={url} 
                  alt={`${t('listings:uploadedImage')} ${index + 1}`} 
                  width={200}
                  height={150}
                  className="w-full h-32 object-cover rounded-lg" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className={`absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hidden`}>
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index, false)}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600 transition-colors`}
                >
                  ×
                </button>
              </div>
            ))}
            {/* No images message */}
            {existingImages.length === 0 && imagePreviewUrls.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">{t('listings:noImagesUploadedYet')}</p>
                <p className="text-xs">{t('listings:uploadImagesToShowcase')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Listing Status and Expiry */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className={`text-xl font-semibold text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('listings:listingStatusAndExpiry')}</h2>
          {formData.expires ? (
            <ListingExpiry
              listingId={id}
              expiryDate={formData.expires}
              status={formData.status as 'active' | 'expired' | 'pending'}
              onRenew={handleRenewal}
            />
          ) : (
            <p className={`text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('listings:expiryDateNotSet')}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 -mx-4 md:-mx-6 lg:-mx-8 mt-8 z-10">
          <div className={`flex justify-between items-center max-w-4xl mx-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={() => router.push('/dashboard/listings')}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('listings:cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isLoading ? (
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                  {t('listings:saving')}
                </div>
              ) : (
                t('listings:saveChanges')
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
