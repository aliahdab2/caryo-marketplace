"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ListingExpiry from "../../components/ListingExpiry";
import { formatNumber } from '../../../../../utils/localization'; // Corrected import path

import { ListingFormData } from '@/types/listings';

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
            {t('common.backToListings', 'Back to Listings')}
          </button>
          {/* Save button might be part of a form element later */}
        </div>
      </div>

      {/* Section for Listing Status and Expiry */}
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{t('dashboard.listingStatusTitle', 'Listing Status & Expiry')}</h3>
        {formData.expires && formData.expires.trim() !== "" ? (
          <ListingExpiry
            listingId={id}
            expiryDate={formData.expires}
            status={formData.status as 'active' | 'expired' | 'pending'} // Note: This type cast might need further review for robustness
            onRenew={handleRenewal}
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.expiryDateNotSet', 'Expiry date is not currently set for this listing.')}
          </p>
        )}
      </div>

      {/* Placeholder for the rest of the form where listing details are edited */}
      {/* <form onSubmit={handleSubmit} className="mt-8 space-y-6"> */}
      {/*   Form fields for title, description, price, etc. would go here */}
      {/*   <div className="flex justify-end space-x-3"> */}
      {/*     <button type="button" onClick={() => router.push('/dashboard/listings')} className="px-4 py-2 border rounded-md text-sm font-medium"> */}
      {/*       {t('common.cancel', 'Cancel')} */}
      {/*     </button> */}
      {/*     <button type="submit" disabled={isSubmitting} className="px-4 py-2 border rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-dark"> */}
      {/*       {isSubmitting ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')} */}
      {/*     </button> */}
      {/*   </div> */}
      {/* </form> */}
    </div>
  );
}
