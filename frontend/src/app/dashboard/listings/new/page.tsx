"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image"; // Renamed to avoid conflict if Image is used elsewhere
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { fetchGovernorates, Governorate } from '@/services/api';
import { getVehicleMakes, getVehicleModels, CarBrand, CarModel } from '@/services/referenceData';
import { createListing } from '@/services/listings';
import { ListingFormData } from "@/types/listings";
import SuccessAlert from '@/components/ui/SuccessAlert';

export default function NewListingPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation(['dashboard', 'listings', 'common', 'errors']);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for success alert
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  // Add state for car makes and models
  const [carMakes, setCarMakes] = useState<CarBrand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

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
  
  // Fetch governorates on component mount
  useEffect(() => {
    const loadGovernorates = async () => {
      setIsLoadingGovernorates(true);
      try {
        const fetchedGovernorates = await fetchGovernorates();
        setGovernorates(fetchedGovernorates);
      } catch (err) {
        console.error('Failed to fetch governorates:', err);
        setError(t('errors:failedToLoadGovernorates'));
      } finally {
        setIsLoadingGovernorates(false);
      }
    };
    loadGovernorates();
  }, [t]);
  
  // Fetch car makes on component mount
  useEffect(() => {
    const loadCarMakes = async () => {
      setIsLoadingMakes(true);
      try {
        const makes = await getVehicleMakes();
        setCarMakes(makes);
        // Clear any related error if successful
        if (error?.includes('car makes')) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch car makes:', err);
        const errorMessage = t('errors:failedToLoadCarMakes', 'Failed to load car makes. Using default options.');
        
        // Only show error for car makes if we're on step 2 or later
        if (currentStep >= 2) {
          setError(errorMessage);
        }
      } finally {
        setIsLoadingMakes(false);
      }
    };
    loadCarMakes();
  }, [t, currentStep, error]);
  
  // Fetch car models when make changes
  useEffect(() => {
    const loadCarModels = async () => {
      if (!formData.make) {
        setCarModels([]);
        return;
      }
      
      // Find the selected brand object
      const selectedBrand = carMakes.find(brand => brand.name === formData.make);
      if (!selectedBrand) {
        setCarModels([]);
        return;
      }
      
      setIsLoadingModels(true);
      try {
        const models = await getVehicleModels(selectedBrand.id);
        setCarModels(models);
        // Clear any error about car models if successful
        if (error && error.includes('car models')) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch car models:', err);
        const errorMessage = t('errors:failedToLoadCarModels', 'Failed to load car models. Please try again.');
        
        // Only show error for car models if we're on step 2 or later
        if (currentStep >= 2) {
          setError(errorMessage);
        }
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadCarModels();
  }, [formData.make, carMakes, t, currentStep, error]);
  
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

    // Validate all required fields
    const requiredFields: { field: keyof ListingFormData, name: string, step: number }[] = [
      { field: 'title', name: t('listings:newListing.title', 'Title'), step: 1 },
      { field: 'description', name: t('listings:newListing.description', 'Description'), step: 1 },
      { field: 'price', name: t('listings:newListing.price', 'Price'), step: 1 },
      { field: 'make', name: t('listings:newListing.make', 'Make/Brand'), step: 2 },
      { field: 'model', name: t('listings:newListing.model', 'Model'), step: 2 },
      { field: 'year', name: t('listings:newListing.year', 'Year'), step: 2 },
      { field: 'mileage', name: t('listings:newListing.mileage', 'Mileage'), step: 2 },
      { field: 'governorateId', name: t('listings:newListing.governorate', 'Governorate'), step: 3 },
      { field: 'contactName', name: t('listings:newListing.contactName', 'Contact Name'), step: 3 },
      { field: 'contactPhone', name: t('listings:newListing.contactPhone', 'Contact Phone'), step: 3 }
    ];
    
    for (const req of requiredFields) {
      if (!formData[req.field]) {
        setError(`${req.name} ${t('errors:isRequired', 'is required')}`);
        setIsSubmitting(false);
        setCurrentStep(req.step);
        return;
      }
    }
    
    // Validate images (at least one image is required) - temporarily disabled for testing
    // if (formData.images.length === 0) {
    //   setError(t('listings:newListing.imageRequired', 'At least one image is required'));
    //   setIsSubmitting(false);
    //   setCurrentStep(4);
    //   return;
    // }

    // Validate categorical ID mapping
    if (!formData.categoryId) {
      // If there's no categoryId, but there is a model selected, try to set a reasonable value
      if (formData.model) {
        const selectedModel = carModels.find(model => model.name === formData.model);
        if (selectedModel) {
          formData.categoryId = selectedModel.id.toString();
        } else {
          formData.categoryId = '1';  // Default fallback
        }
      } else {
        formData.categoryId = '1';  // Default fallback
      }
    }
    
    // Validate numeric fields
    if (parseInt(formData.year, 10) < 1920 || parseInt(formData.year, 10) > new Date().getFullYear()) {
      setError(t('errors:invalidYear', 'Please enter a valid year between 1920 and current year'));
      setIsSubmitting(false);
      setCurrentStep(2);
      return;
    }
    
    if (parseInt(formData.mileage, 10) < 0) {
      setError(t('errors:invalidMileage', 'Mileage cannot be negative'));
      setIsSubmitting(false);
      setCurrentStep(2);
      return;
    }
    
    if (parseFloat(formData.price) <= 0) {
      setError(t('errors:invalidPrice', 'Price must be greater than zero'));
      setIsSubmitting(false);
      setCurrentStep(1);
      return;
    }
    
    console.log("Submitting listing data:", formData);
    
    try {
      const response = await createListing(formData); 
      console.log("Listing created:", response);
      setIsSubmitting(false);
      
      // Show success message and redirect
      setShowSuccessAlert(true);
      // Don't redirect immediately - let the success alert handle it
    } catch (error) {
      console.error("Error creating listing:", error);
      setError(t('errors:failedToSubmitListing', 'Failed to create listing. Please try again.'));
      setIsSubmitting(false);
    }
  };

  // Store image object URLs for preview to avoid calling createObjectURL on every render
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Handle success alert completion
  const handleSuccessAlertComplete = () => {
    setShowSuccessAlert(false);
    router.push("/dashboard/listings");
  };

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
      <h1 className="text-2xl font-semibold mb-6">{t('dashboard:createListing')}</h1>
      
      <div className="mb-8"> {/* Progress Bar */}
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center 
                  ${currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
              >
                {step}
              </div>
              <span className="text-xs mt-1 hidden md:block">
                {t(`listings:step${step}Title`, `Step ${step}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-2 bg-gray-200 dark:bg-gray-700 w-full rounded-full"></div>
          <div 
            className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-300"
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
              <h2 className="text-xl font-semibold">{t('listings:newListing.step1Title', 'Basic Information')}</h2>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings:newListing.title')} *
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings:newListing.titlePlaceholder', 'e.g., Beautiful Car for Sale')}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings:newListing.description')} *
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  placeholder={t('listings:newListing.descriptionPlaceholder', 'Describe your listing in detail...')}
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('listings:newListing.price')} *
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
                  placeholder={t('listings:newListing.pricePlaceholder', '25000')}
                />
              </div>
            </div>
          )}
          
          {currentStep === 2 && ( /* Step 2: Details */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings:newListing.step2Title', 'Car Details')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.make', 'Make/Brand')} *
                  </label>
                  <div className="relative">
                    <select
                      name="make"
                      id="make"
                      value={formData.make}
                      onChange={handleChange}
                      required
                      className={`w-full p-2 border rounded-lg ${
                        isLoadingMakes 
                          ? "bg-gray-100 dark:bg-gray-600" 
                          : "bg-white dark:bg-gray-700"
                      } ${
                        carMakes.length === 0 && !isLoadingMakes
                          ? "border-amber-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isLoadingMakes}
                    >
                      <option value="">{t('listings:newListing.selectMake', 'Select Make')}</option>
                      {carMakes.map((make) => (
                        <option key={make.id} value={make.name}>
                          {i18n.language === 'ar' ? make.displayNameAr : make.displayNameEn}
                        </option>
                      ))}
                    </select>
                    {isLoadingMakes && (
                      <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  {isLoadingMakes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('listings:newListing.loadingMakes', 'Loading car makes...')}
                    </p>
                  )}
                  {carMakes.length === 0 && !isLoadingMakes && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {t('listings:newListing.usingDefaultMakes', 'Using default car makes - API connection issue')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.model', 'Model')} *
                  </label>
                  <div className="relative">
                    <select
                      name="model"
                      id="model"
                      value={formData.model}
                      onChange={(e) => {
                        // When model changes, also update the categoryId
                        const modelName = e.target.value;
                        const selectedModel = carModels.find(model => model.name === modelName);
                        const categoryId = selectedModel ? selectedModel.id.toString() : '1'; // Use model ID
                        
                        setFormData(prev => ({
                          ...prev,
                          model: modelName,
                          categoryId: categoryId
                        }));
                      }}
                      required
                      className={`w-full p-2 border rounded-lg ${
                        isLoadingModels || !formData.make
                          ? "bg-gray-100 dark:bg-gray-600" 
                          : "bg-white dark:bg-gray-700"
                      } ${
                        formData.make && carModels.length === 0 && !isLoadingModels
                          ? "border-amber-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isLoadingModels || !formData.make}
                    >
                      <option value="">{t('listings:newListing.selectModel', 'Select Model')}</option>
                      {carModels.map((model) => (
                        <option key={model.id} value={model.name}>
                          {i18n.language === 'ar' ? model.displayNameAr : model.displayNameEn}
                        </option>
                      ))}
                    </select>
                    {isLoadingModels && (
                      <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  {isLoadingModels && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {t('listings:newListing.loadingModels', 'Loading car models...')}
                    </p>
                  )}
                  {formData.make && carModels.length === 0 && !isLoadingModels && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {t('listings:newListing.usingDefaultModels', 'Using default models - API connection issue')}
                    </p>
                  )}
                  
                  {/* Hidden field to store the categoryId/modelId */}
                  <input
                    type="hidden"
                    name="categoryId"
                    id="categoryId"
                    value={formData.categoryId || '1'} // Default to 1 or another safe value
                  />
                </div>
                
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.year', 'Year')} *
                  </label>
                  <input
                    type="number"
                    name="year"
                    id="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min="1920"
                    max={new Date().getFullYear()} // Current year
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings:newListing.yearPlaceholder', 'e.g., 2020')}
                  />
                </div>
                
                <div>
                  <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.mileage', 'Mileage (km)')} *
                  </label>
                  <input
                    type="number"
                    name="mileage"
                    id="mileage"
                    value={formData.mileage}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings:newListing.mileagePlaceholder', 'e.g., 50000')}
                  />
                </div>
                
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.condition', 'Condition')} *
                  </label>
                  <select
                    name="condition"
                    id="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="new">{t('listings:newListing.conditionNew', 'New')}</option>
                    <option value="used">{t('listings:newListing.conditionUsed', 'Used')}</option>
                    <option value="certified">{t('listings:newListing.conditionCertified', 'Certified Pre-owned')}</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.transmission', 'Transmission')}
                  </label>
                  <select
                    name="transmission"
                    id="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('listings:newListing.selectTransmission', 'Select Transmission')}</option>
                    <option value="automatic">{t('listings:newListing.automatic', 'Automatic')}</option>
                    <option value="manual">{t('listings:newListing.manual', 'Manual')}</option>
                    <option value="cvt">{t('listings:newListing.cvt', 'CVT')}</option>
                    <option value="semi-automatic">{t('listings:newListing.semiAutomatic', 'Semi-Automatic')}</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.fuelType', 'Fuel Type')}
                  </label>
                  <select
                    name="fuelType"
                    id="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="">{t('listings:newListing.selectFuelType', 'Select Fuel Type')}</option>
                    <option value="petrol">{t('listings:newListing.petrol', 'Petrol')}</option>
                    <option value="diesel">{t('listings:newListing.diesel', 'Diesel')}</option>
                    <option value="hybrid">{t('listings:newListing.hybrid', 'Hybrid')}</option>
                    <option value="electric">{t('listings:newListing.electric', 'Electric')}</option>
                    <option value="lpg">{t('listings:newListing.lpg', 'LPG')}</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="exteriorColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.exteriorColor', 'Exterior Color')}
                  </label>
                  <input
                    type="text"
                    name="exteriorColor"
                    id="exteriorColor"
                    value={formData.exteriorColor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings:newListing.colorPlaceholder', 'e.g., White')}
                  />
                </div>
                
                <div>
                  <label htmlFor="interiorColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings:newListing.interiorColor', 'Interior Color')}
                  </label>
                  <input
                    type="text"
                    name="interiorColor"
                    id="interiorColor"
                    value={formData.interiorColor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder={t('listings:newListing.colorPlaceholder', 'e.g., Black')}
                  />
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 3 && ( /* Step 3: Location & Contact */
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t('listings:newListing.step3Title', 'Location & Contact')}</h3>
              <div>
                <label htmlFor="governorateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings:newListing.governorate')} *</label>
                <select
                  id="governorateId"
                  name="governorateId"
                  value={formData.governorateId}
                  onChange={handleChange}
                  disabled={isLoadingGovernorates}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">{t('listings:newListing.selectGovernorate', 'Select Governorate')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {i18n.language === 'ar' ? gov.displayNameAr : gov.displayNameEn}
                    </option>
                  ))}
                </select>
                {isLoadingGovernorates && <p className="text-sm text-gray-500 dark:text-gray-400">{t('loadingGovernorates', 'Loading governorates...')}</p>}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings:newListing.location')}</label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  value={formData.location || ''} 
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings:newListing.locationPlaceholder', 'e.g., Street name, building, landmark')}
                />
              </div>
              
              <div>
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings:newListing.contactName')} *</label>
                <input
                  type="text"
                  name="contactName"
                  id="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings:newListing.contactNamePlaceholder', 'Your Name')}
                />
              </div>
              
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings:newListing.contactPhone')} *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings:newListing.contactPhonePlaceholder', 'e.g., +965 12345678')}
                />
              </div>

              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('listings:newListing.contactEmail')}</label>
                <input
                  type="email"
                  name="contactEmail"
                  id="contactEmail"
                  value={formData.contactEmail || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder={t('listings:newListing.contactEmailPlaceholder', 'your.email@example.com')}
                />
              </div>
            </div>
          )}
          
          {currentStep === 4 && ( /* Step 4: Images */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('listings:newListing.step4Title', 'Upload Images')}</h2>
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('listings:newListing.images')} *
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
                  {t('listings:newListing.imageUploadTip', 'You can upload multiple images. PNG, JPG, GIF up to 10MB.')}
                </p>
                <p className="mt-2 text-sm text-amber-500 dark:text-amber-400">
                  <strong>{t('listings:newListing.primaryImageNote', 'Note:')}</strong> {t('listings:newListing.primaryImageDescription', 'The first image will be used as the primary image shown in search results.')}
                </p>
              </div>
              
              {imagePreviewUrls.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">{t('listings:newListing.imagePreview', 'Image Preview')}</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className={`relative group ${index === 0 ? 'border-2 border-primary rounded-md' : ''}`}>
                        <NextImage 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          width={128} 
                          height={128} 
                          className="w-full h-32 object-cover rounded-md" 
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded-md">
                            {t('listings:newListing.primaryImage', 'Primary')}
                          </span>
                        )}
                        <div className="absolute bottom-1 right-1 flex gap-1">
                          <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500 text-white rounded-full p-1 text-xs opacity-75 group-hover:opacity-100 transition-opacity"
                            aria-label={t('listings:newListing.removeImage', 'Remove image')}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {formData.images.length === 0 && (
                    <p className="text-red-500 mt-2">{t('listings:newListing.imageRequired', 'At least one image is required')}</p>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('listings:newListing.noImagesSelected', 'No images selected yet')}
                  </p>
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
                  {t('listings:newListing.previous', 'Previous')}
                </button>
              )}
            </div>
            
            <div>
              {currentStep < 4 && (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('listings:newListing.next', 'Next')}
                </button>
              )}
              {currentStep === 4 && (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isSubmitting ? t('listings:newListing.submitting', 'Submitting...') : t('listings:newListing.submit', 'Submit Listing')}
                </button>
              )}
            </div>
          </div>
        </form>
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
