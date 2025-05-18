"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ListingExpiry from "../../components/ListingExpiry";
import { formatNumber } from '../../../../../utils/localization'; // Corrected import path

// Define the interface for the form data
interface ListingFormData {
  id?: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: string;
  price: string;
  currency: string;
  condition: string;
  mileage: string;
  exteriorColor: string;
  interiorColor: string;
  transmission: string;
  fuelType: string;
  features: string[];
  location: string;
  city: string;
  contactPreference: string;
  images: File[];
  status: 'active' | 'expired' | 'pending' | ''; // Adjusted to include empty string for initial state
  created: string;
  expires: string;
  views: number;
}

// Mock data for a listing (in a real app, this would come from an API fetch)
const MOCK_LISTING: ListingFormData = {
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
  images: [], // This empty array is assignable to File[]
  status: "active",
  created: "2023-05-15",
  expires: "2023-08-15",
  views: 120
};

// Client component
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common'); // Added i18n
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<ListingFormData>({
    title: "",
    description: "",
    make: "",
    model: "",
    year: "",
    price: "",
    currency: "",
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
    status: "", // Initial state can be an empty string
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
          setFormData(MOCK_LISTING); // Kept as any for mock data flexibility
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching listing:", error);
        // Redirect to listings page in case of error
        router.push("/dashboard/listings");
      }
    };
    
    fetchListing();
  }, [id, router]);
  
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
            onClick={() => router.push(`/listings/${id}`)}
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
          listingId={id}
          expiryDate={formData.expires}
          status={formData.status as ('active' | 'expired' | 'pending')}
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
            
            {/* More sections omitted for brevity */}
            
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
          </div>
        </form>
      </div>
    </div>
  );
}
