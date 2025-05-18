"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ListingExpiry from "../../components/ListingExpiry";
import { formatNumber } from '../../../../../utils/localization'; // Corrected import path

// Mock data for a listing (in a real app, this would come from an API fetch)
const MOCK_LISTING = {
  id: "1",
  title: "Toyota Camry 2020",
  description: "Well maintained Toyota Camry with low mileage. One owner, service history available.",
  make: "Toyota",
  model: "Camry",
  year: "2020",
  price: "25000",
  currency: "USD", // Added currency
  condition: "used",
  mileage: "45000",
  exteriorColor: "Silver",
  interiorColor: "Black",
  transmission: "automatic",
  fuelType: "gasoline",
  features: ["airConditioning", "bluetoothConnectivity", "cruiseControl", "alloyWheels"],
  location: "Dubai Marina",
  city: "Dubai",
  contactPreference: "both",
  images: [],
  status: "active",
  created: "2023-05-15",
  expires: "2023-08-15",
  views: 120
};

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common'); // Added i18n
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    price: "",
    currency: "", // Added currency
    condition: "used",
    mileage: "",
    exteriorColor: "",
    interiorColor: "",
    transmission: "",
    fuelType: "",
    features: [] as string[],
    location: "",
    city: "",
    contactPreference: "both",
    images: [] as File[],
    status: "",
    created: "",
    expires: "",
    views: 0
  });
  
  // Available car features
  const carFeatures = [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ];
  
  // Fetch listing data
  useEffect(() => {
    // In a real app, fetch the listing data from the API
    // For the mock, use setTimeout to simulate an API call
    const fetchListing = async () => {
      try {
        setTimeout(() => {
          setFormData(MOCK_LISTING as any); // Kept as any for mock data flexibility
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching listing:", error);
        // Redirect to listings page in case of error
        router.push("/dashboard/listings");
      }
    };
    
    fetchListing();
  }, [params.id, router]);
  
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
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // In a real app, perform API call to update listing
    console.log("Updating listing data:", formData);
    
    // Simulate API call
    try {
      setTimeout(() => {
        setIsSubmitting(false);
        // Redirect to listings page after successful update
        router.push("/dashboard/listings");
      }, 1500);
    } catch (error) {
      console.error("Error updating listing:", error);
      setIsSubmitting(false);
      // Show error message
    }
  };
  
  // Handle listing renewal
  const handleRenewal = (id: string, duration: number) => {
    // In a real app, perform API call to renew listing
    console.log(`Renewing listing ${id} for ${duration} days`);
    
    // Update expiry date in the local state
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + duration);
    
    setFormData(prev => ({
      ...prev,
      status: "active",
      expires: newExpiry.toISOString().split('T')[0]
    }));
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">{t('dashboard.editListing')}</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push("/dashboard/listings")}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => router.push(`/listings/${params.id}`)}
            className="py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary/10"
          >
            {t('listings.preview')}
          </button>
        </div>
      </div>
      
      {/* Listing Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">{t('listings.status')}:</span>
          <div className="flex items-center">
            <span 
              className={`inline-block w-3 h-3 rounded-full mr-2 ${
                formData.status === 'active' 
                  ? 'bg-green-500' 
                  : formData.status === 'expired'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            ></span>
            <span className="font-medium">
              {t(`listings.${formData.status}`)}
            </span>
          </div>
        </div>
        
        <ListingExpiry 
          listingId={params.id}
          expiryDate={formData.expires}
          status={formData.status}
          onRenew={handleRenewal}
        />
        
        <div className="text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1">{t('listings.views')}:</span>
          <span className="font-medium">{formatNumber(formData.views, i18n.language)}</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('listings.step1Title')}</h2>
              <div className="space-y-4">
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
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('common.price')} *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vehicle Details */}
            <div className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-xl font-semibold mb-4">{t('listings.step2Title')}</h2>
              <div className="space-y-4">
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
            </div>
            
            {/* Location & Contact */}
            <div className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-xl font-semibold mb-4">{t('listings.step3Title')}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('common.location')} *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('common.city')} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
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
            </div>
            
            {/* Images */}
            <div className="border-t dark:border-gray-700 pt-8">
              <h2 className="text-xl font-semibold mb-4">{t('listings.step4Title')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('listings.uploadImages')}
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
                
                {/* Preview existing images */}
                {formData.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('listings.uploadedImages')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                            {typeof file === 'string' ? (
                              <Image
                                src={file}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover"
                                width={200}
                                height={96}
                              />
                            ) : (
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover"
                                width={200}
                                height={96}
                              />
                            )}
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
              </div>
            </div>
          </div>
          
          {/* Bottom action buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push("/dashboard/listings")}
              className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`py-2 px-6 bg-primary text-white rounded-lg hover:bg-primary/90 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? t('common.updating') : t('common.saveChanges')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
