"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { fetchGovernorates, Governorate } from '@/services/api';
import { getVehicleMakes, getVehicleModels, CarBrand, CarModel } from '@/services/referenceData';
import { createListing } from '@/services/listings';
import { ListingFormData } from "@/types/listings";
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import SuccessAlert from '@/components/ui/SuccessAlert';

// Helper function to convert Arabic-Indic numerals to Latin numerals
const _convertArabicNumerals = (input: string): string => {
  if (!input) return input;
  
  const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
  const latinNumerals = '0123456789';
  
  return input.replace(/[٠-٩]/g, (char) => {
    const index = arabicNumerals.indexOf(char);
    return index !== -1 ? latinNumerals[index] : char;
  });
};

export default function NewListingPage() {
  const router = useRouter();
  const { t, i18n } = useLazyTranslation(['dashboard', 'listings', 'common', 'errors']);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_governorates, setGovernorates] = useState<Governorate[]>([]);
  const [_isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [_carMakes, setCarMakes] = useState<CarBrand[]>([]);
  const [_carModels, setCarModels] = useState<CarModel[]>([]);
  const [_isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [_isLoadingModels, setIsLoadingModels] = useState(false);

  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    price: "",
    currency: "USD",
    mileage: "",
    transmission: "",
    fuelType: "",
    exteriorColor: "",
    interiorColor: "",
    governorateId: "",
    contactPhone: "",
    contactName: "",
    contactEmail: "",
    contactPreference: "phone",
    condition: "used",
    features: [],
    city: "",
    status: "active" as const,
    images: [],
    categoryId: "1"
  });

  // Store image object URLs for preview
  const [_imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createListing(formData);
      setShowSuccessAlert(true);
    } catch (error) {
      console.error("Error creating listing:", error);
      setError(t('errors:failedToSubmitListing', 'Failed to create listing. Please try again.'));
      setIsSubmitting(false);
    }
  };

  // Handle success alert completion
  const handleSuccessAlertComplete = () => {
    setShowSuccessAlert(false);
    router.push("/dashboard/listings");
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingGovernorates(true);
        const govs = await fetchGovernorates();
        setGovernorates(govs);
      } catch (error) {
        console.error("Error loading governorates:", error);
      } finally {
        setIsLoadingGovernorates(false);
      }
    };

    loadData();
  }, []);

  // Load car makes
  useEffect(() => {
    const loadMakes = async () => {
      try {
        setIsLoadingMakes(true);
        const makes = await getVehicleMakes();
        setCarMakes(makes);
      } catch (error) {
        console.error("Error loading car makes:", error);
      } finally {
        setIsLoadingMakes(false);
      }
    };

    loadMakes();
  }, []);

  // Load car models when make changes
  useEffect(() => {
    if (formData.make) {
      const loadModels = async () => {
        try {
          setIsLoadingModels(true);
          const models = await getVehicleModels(parseInt(formData.make));
          setCarModels(models);
        } catch (error) {
          console.error("Error loading car models:", error);
        } finally {
          setIsLoadingModels(false);
        }
      };

      loadModels();
    } else {
      setCarModels([]);
    }
  }, [formData.make]);

  // Handle image preview URLs
  useEffect(() => {
    const newUrls = formData.images.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newUrls);

    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard:createListing', 'Create New Listing')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('listings:newListing.subtitle', 'Share your car with potential buyers in a few simple steps')}
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Enhanced Progress Bar */}
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              {[
                { step: 1, title: t('listings:newListing.step1Title', 'Basic Info'), icon: '📝' },
                { step: 2, title: t('listings:newListing.step2Title', 'Details'), icon: '🚗' },
                { step: 3, title: t('listings:newListing.step3Title', 'Location & Contact'), icon: '📍' },
                { step: 4, title: t('listings:newListing.step4Title', 'Images'), icon: '📸' }
              ].map(({ step, title, icon }) => (
                <div key={step} className="flex flex-col items-center relative">
                  <button
                    type="button"
                    onClick={() => step <= currentStep && setCurrentStep(step)}
                    disabled={step > currentStep}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-lg relative z-10 ${
                      currentStep >= step 
                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 cursor-pointer transform hover:scale-105' 
                        : currentStep + 1 === step
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-600 animate-pulse'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {currentStep > step ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : currentStep === step ? icon : step}
                  </button>
                  <span className={`text-sm mt-3 text-center max-w-24 font-medium transition-colors duration-300 ${
                    currentStep >= step 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {title}
                  </span>
                  {step < 4 && (
                    <div className={`absolute top-6 left-12 w-20 h-0.5 transition-colors duration-300 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress percentage */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>{t('listings:newListing.stepCounter', 'Step {{current}} of {{total}}', { current: currentStep, total: 4 })}</span>
                <span>{Math.round((currentStep / 4) * 100)}% {t('common:complete', 'Complete')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Enhanced progress bar with animation */}
            <div className="mt-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20"></div>
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1 rounded-full transition-all duration-700 ease-out relative z-10"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('listings:newListing.navigationHint', 'Use Alt + ← → or click step numbers to navigate')}
              </span>
            </p>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Step Header */}
                <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {t('listings:newListing.step1Title', 'Basic Information')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('listings:newListing.step1Description', 'Tell us about your car listing')}
                  </p>
                </div>

                {/* Title Field */}
                <div className="group">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-2 dark:bg-blue-900 dark:text-blue-300">
                      📝
                    </span>
                    {t('listings:newListing.title', 'Listing Title')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                    placeholder={t('listings:newListing.titlePlaceholder', 'e.g., 2020 Toyota Camry - Excellent Condition')}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Make it descriptive and appealing to buyers
                  </p>
                </div>

                {/* Price and Currency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 group">
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-semibold mr-2 dark:bg-green-900 dark:text-green-300">
                        💰
                      </span>
                      {t('listings:newListing.price', 'Price')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                      placeholder="25000"
                      required
                    />
                  </div>
                  
                  <div className="group">
                    <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-2 dark:bg-blue-900 dark:text-blue-300">
                        💱
                      </span>
                      {t('listings:newListing.currency', 'Currency')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${
                        i18n.language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      required
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code} - {i18n.language === 'ar' ? curr.nameAr : curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="group">
                  <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold mr-2 dark:bg-purple-900 dark:text-purple-300">
                      📄
                    </span>
                    {t('listings:newListing.description', 'Description')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 resize-vertical"
                    placeholder={t('listings:newListing.descriptionPlaceholder', 'Describe your car in detail...')}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Include key features, condition, and any special details
                  </p>
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('common:previous', 'Previous')}
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {t('common:next', 'Next')}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('listings:newListing.submitting', 'Submitting...')}
                    </>
                  ) : (
                    <>
                      {t('listings:newListing.submit', 'Submit Listing')}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Success Alert */}
      <SuccessAlert
        message={t('listings:newListing.successMessage', 'Listing created successfully!')}
        visible={showSuccessAlert}
        onComplete={handleSuccessAlertComplete}
        autoHideDuration={3000}
      />
    </div>
  );
}
