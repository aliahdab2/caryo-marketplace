"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function NewListingPage() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state (in a real app, use React Hook Form for validation)
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    price: "",
    
    // Step 2: Details
    condition: "used",
    mileage: "",
    exteriorColor: "",
    interiorColor: "",
    transmission: "",
    fuelType: "",
    features: [] as string[],
    
    // Step 3: Location & Contact
    location: "",
    city: "",
    contactPreference: "both",
    
    // Step 4: Images
    images: [] as File[]
  });
  
  // Available car features
  const carFeatures = [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ];
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox change for features
  const handleFeatureChange = (feature: string) => {
    setFormData(prev => {
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
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array and append to existing images
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };
  
  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  // Next step
  const nextStep = () => {
    // In a real app, validate each step before proceeding
    setCurrentStep(prev => prev + 1);
  };
  
  // Previous step
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, perform API call to create listing
    console.log("Submitting listing data:", formData);
    
    // Simulate API call
    try {
      // Mock API success
      setTimeout(() => {
        setIsSubmitting(false);
        // Redirect to listings page after successful creation
        router.push("/dashboard/listings");
      }, 1500);
    } catch (error) {
      console.error("Error creating listing:", error);
      setIsSubmitting(false);
      // Show error message
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">{t('dashboard.createListing')}</h1>
      
      {/* Progress Bar */}
      <div className="mb-8">
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
                {t(`listings.step${step}Title`)}
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
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.step1Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings.titlePlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.description')} *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings.descriptionPlaceholder')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.make')} *
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Toyota, Honda, BMW..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.model')} *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Camry, Civic, X5..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.year')} *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="2023"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('price')} *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="25000"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Vehicle Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.step2Title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.condition')} *
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="new">{t('listings.new')}</option>
                    <option value="used">{t('listings.used')}</option>
                    <option value="certified">{t('listings.certified')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.mileage')} *
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="45000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.exteriorColor')}
                  </label>
                  <input
                    type="text"
                    name="exteriorColor"
                    value={formData.exteriorColor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings.colorPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.interiorColor')}
                  </label>
                  <input
                    type="text"
                    name="interiorColor"
                    value={formData.interiorColor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings.colorPlaceholder')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.transmission')} *
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('listings.selectTransmission')}</option>
                    <option value="automatic">{t('listings.automatic')}</option>
                    <option value="manual">{t('listings.manual')}</option>
                    <option value="semi-automatic">{t('listings.semiAutomatic')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.fuelType')} *
                  </label>
                  <select
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('listings.selectFuelType')}</option>
                    <option value="gasoline">{t('listings.gasoline')}</option>
                    <option value="diesel">{t('listings.diesel')}</option>
                    <option value="electric">{t('listings.electric')}</option>
                    <option value="hybrid">{t('listings.hybrid')}</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('listings.features')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {carFeatures.map(feature => (
                    <div key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        id={feature}
                        checked={formData.features.includes(feature)}
                        onChange={() => handleFeatureChange(feature)}
                        className="mr-2 h-4 w-4 text-primary"
                      />
                      <label htmlFor={feature} className="text-sm">
                        {t(`listings.features.${feature}`)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Location & Contact */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.step3Title')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('location')} *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings.locationPlaceholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('city')} *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Dubai, Abu Dhabi, Sharjah..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.contactPreference')} *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="contact-both"
                      name="contactPreference"
                      value="both"
                      checked={formData.contactPreference === "both"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label htmlFor="contact-both">
                      {t('listings.contactBoth')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="contact-email"
                      name="contactPreference"
                      value="email"
                      checked={formData.contactPreference === "email"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label htmlFor="contact-email">
                      {t('listings.contactEmail')}
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="contact-phone"
                      name="contactPreference"
                      value="phone"
                      checked={formData.contactPreference === "phone"}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label htmlFor="contact-phone">
                      {t('listings.contactPhone')}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Images */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings.step4Title')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings.uploadImages')} *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark">
                        <span>{t('listings.uploadFile')}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">{t('listings.dragAndDrop')}</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Preview uploaded images */}
              {formData.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('listings.uploadedImages')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="h-24 rounded-lg overflow-hidden">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                            width={200}
                            height={96}
                            unoptimized
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm"
                        >
                          <span className="text-red-500">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                  {t('listings.listingDuration')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('listings.listingDurationDesc')}
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-100 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    {t('listings.freeListingInfo', { days: '30' })}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('back')}
              </button>
            ) : (
              <div></div> // Empty div to maintain flex spacing
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {t('next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? t('submitting') : t('publish')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
