"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image"; // Renamed to avoid conflict if Image is used elsewhere
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { fetchGovernorates, Governorate } from '@/services/api';
import { ListingFormData } from "@/types/listings";
// import { fetchCategories, Category, Attribute } from "@/services/api"; 

export default function NewListingPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    make: "", // Ensure these are appropriate for your generic ListingFormData
    model: "",
    year: "",
    price: "", // Price as string
    currency: "USD", // Default currency, adjust as needed
    condition: "used",
    mileage: "",
    exteriorColor: "",
    interiorColor: "",
    transmission: "",
    fuelType: "",
    features: [],
    categoryId: "", 
    attributes: {},
    location: "",
    governorateId: "",
    city: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactPreference: "both",
    images: [],
    status: 'pending',
  });
  
  useEffect(() => {
    const loadGovernorates = async () => {
      setIsLoadingGovernorates(true);
      try {
        const fetchedGovernorates = await fetchGovernorates();
        setGovernorates(fetchedGovernorates);
      } catch (err) {
        console.error('Failed to fetch governorates:', err);
        setError(t('errors.failedToLoadGovernorates'));
      } finally {
        setIsLoadingGovernorates(false);
      }
    };
    loadGovernorates();
  }, [t]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.governorateId) {
        setError(t('errors.governorateRequired'));
        setIsSubmitting(false);
        setCurrentStep(3); 
        return;
    }
    
    console.log("Submitting listing data:", formData);
    
    try {
      // const response = await createListing(formData); 
      // console.log("Listing created:", response);
      setTimeout(() => {
        setIsSubmitting(false);
        router.push("/dashboard/listings");
      }, 1500);
    } catch (error) {
      console.error("Error creating listing:", error);
      setError(t('errors.failedToSubmitListing'));
      setIsSubmitting(false);
    }
  };

  // Store image object URLs for preview to avoid calling createObjectURL on every render
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const newUrls = formData.images.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newUrls);

    // Cleanup function to revoke object URLs when component unmounts or images change
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('dashboard.createListing')}</h1>
      
      <div className="mb-8"> {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${currentStep >= step 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
              >
                {step}
              </div>
              <span className="text-xs mt-1 hidden md:block">
                {t(`listings.step${step}Title`, `Step ${step}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-2 bg-gray-200 dark:bg-gray-700 w-full rounded-full"></div>
          <div 
            className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-200 dark:border-red-700">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          {currentStep === 1 && ( /* Step 1: Basic Info */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.newListing.step1Title', 'Basic Information')}</h2>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.newListing.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings.newListing.titlePlaceholder', 'e.g., Beautiful Apartment for Rent')}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.newListing.description')} *
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings.newListing.descriptionPlaceholder', 'Describe your listing in detail...')}
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.newListing.price')} *
                </label>
                <input
                  type="text" // Changed to text to align with string type for price
                  name="price"
                  id="price"
                  value={formData.price} // formData.price is a string
                  onChange={handleChange}
                  required
                  pattern="^[0-9]*[.,]?[0-9]+$" // Optional: pattern for numeric input if needed
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings.newListing.pricePlaceholder', '25000')}
                />
              </div>
            </div>
          )}
          
          {currentStep === 2 && ( /* Step 2: Details */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.newListing.step2Title', 'Details')}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('listings.newListing.attributesDescription', 'Attributes for this category will be displayed here. (Implementation pending)')}
              </p>
            </div>
          )}
          
          {currentStep === 3 && ( /* Step 3: Location & Contact */
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('listings.newListing.step3Title', 'Location & Contact')}</h3>
              <div>
                <label htmlFor="governorateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings.newListing.governorate')} *</label>
                <select
                  id="governorateId"
                  name="governorateId"
                  value={formData.governorateId}
                  onChange={handleChange}
                  disabled={isLoadingGovernorates}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">{t('listings.newListing.selectGovernorate', 'Select Governorate')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {i18n.language === 'ar' ? gov.displayNameAr : gov.displayNameEn}
                    </option>
                  ))}
                </select>
                {isLoadingGovernorates && <p className="text-sm text-gray-500 dark:text-gray-400">{t('loadingGovernorates', 'Loading governorates...')}</p>}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings.newListing.location')}</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location || ''} 
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings.newListing.locationPlaceholder', 'e.g., Street name, building, landmark')}
                />
              </div>
              
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings.newListing.contactName')} *</label>
                <input
                  type="text"
                  name="contactName"
                  id="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings.newListing.contactNamePlaceholder', 'Your Name')}
                />
              </div>
              
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings.newListing.contactPhone')} *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings.newListing.contactPhonePlaceholder', 'e.g., +965 12345678')}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings.newListing.contactEmail')}</label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings.newListing.contactEmailPlaceholder', 'your.email@example.com')}
                />
              </div>
            </div>
          )}
          
          {currentStep === 4 && ( /* Step 4: Images */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.newListing.step4Title', 'Upload Images')}</h2>
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('listings.newListing.images')}
                </label>
                <input
                  type="file"
                  name="images"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-700 dark:file:text-primary-50 dark:hover:file:bg-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('listings.newListing.imageUploadTip', 'You can upload multiple images. PNG, JPG, GIF up to 10MB.')}
                </p>
              </div>
              
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <NextImage 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        width={128} // Provide appropriate width
                        height={128} // Provide appropriate height
                        className="w-full h-32 object-cover rounded-md" 
                      />
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs opacity-75 group-hover:opacity-100 transition-opacity"
                        aria-label={t('listings.newListing.removeImage', 'Remove image')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
                >
                  {t('listings.newListing.previous', 'Previous')}
                </button>
              )}
            </div>
            
            <div>
              {currentStep < 4 && (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('listings.newListing.next', 'Next')}
                </button>
              )}
              {currentStep === 4 && (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? t('listings.newListing.submitting', 'Submitting...') : t('listings.newListing.submit', 'Submit Listing')}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
