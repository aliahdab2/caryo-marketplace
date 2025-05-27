"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ListingFormData } from '@/types/listings';
import { Governorate, fetchGovernorates } from '@/services/api';
import ListingExpiry from "../../components/ListingExpiry";

// Mock data for a listing (in a real app, this would come from an API fetch)
const MOCK_LISTING: ListingFormData = {
  id: "1",
  governorateId: "1", // String ID as expected by ListingFormData
  title: "Toyota Camry 2020",
  description: "Well maintained Toyota Camry with low mileage. One owner, service history available.",
  make: "Toyota",
  model: "Camry",
  year: "2020",
  price: "25000",
  currency: "USD", 
  condition: "used",
  mileage: "45000",
  exteriorColor: "Silver",
  interiorColor: "Black",
  transmission: "automatic",
  fuelType: "gasoline",
  features: ["airConditioning", "bluetoothConnectivity", "cruiseControl", "alloyWheels"],
  location: "Dubai Marina",
  city: "Dubai",
  contactName: "John Doe", 
  contactPhone: "+123456789",
  contactEmail: "john@example.com",
  contactPreference: "both",
  images: [], 
  status: "active",
  created: "2023-05-15",
  expires: "2023-08-15",
  views: 120,
  categoryId: "",
  attributes: {}
};

// Client component
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData>({
    ...MOCK_LISTING,
    governorateId: MOCK_LISTING.governorateId || "",
  });
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Store image object URLs for preview
  useEffect(() => {
    const newUrls = formData.images.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(newUrls);

    // Cleanup function to revoke object URLs when component unmounts or images change
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.images]);

  // Available car features
  const carFeatures = [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ];

  useEffect(() => {
    // In a real app, fetch the listing data based on listingId
    console.log("Fetching listing data for ID:", id);        const loadGovernorates = async () => {
      try {
        setIsLoadingGovernorates(true);
        const fetchedGovernorates = await fetchGovernorates();
        // Pass the governorates directly without trying to modify their structure
        setGovernorates(fetchedGovernorates);
      } catch (err) {
        console.error("Failed to fetch governorates", err);
        setError("Failed to load governorates. Please try again.");
      } finally {
        setIsLoadingGovernorates(false);
      }
    };
    loadGovernorates();
  }, [id]);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // In a real app, perform API call to update listing
    console.log("Updating listing data:", formData);

    try {
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to listings page after successful update
        router.push("/dashboard/listings");
      }, 1500);
    } catch (error) {
      console.error("Error updating listing:", error);
      setIsLoading(false);
      setError("Failed to update listing. Please try again.");
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

  if (!formData.id) {
    return <div>Loading listing data...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Edit Listing</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Toyota Camry 2020"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the car"
          required
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Governorate and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="governorateId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Governorate</label>
          <select
            id="governorateId"
            name="governorateId"
            value={formData.governorateId}
            onChange={handleChange}
            required
            disabled={isLoadingGovernorates}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">{isLoadingGovernorates ? "Loading governorates..." : "Select Governorate"}</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={String(gov.id)}>
                {gov.displayNameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specific Location / Address</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location || ''}
            onChange={handleChange}
            placeholder="e.g., Street Name, Building No."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
      
      {/* Make */}
      <div>
        <label htmlFor="make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make</label>
        <input
          id="make"
          name="make"
          type="text"
          value={formData.make}
          onChange={handleChange}
          placeholder="e.g., Toyota"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Model */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
        <input
          id="model"
          name="model"
          type="text"
          value={formData.model}
          onChange={handleChange}
          placeholder="e.g., Camry"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Year */}
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
        <input
          id="year"
          name="year"
          type="number"
          value={formData.year}
          onChange={handleChange}
          placeholder="e.g., 2020"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
        <input
          id="price"
          name="price"
          type="text"
          value={formData.price}
          onChange={handleChange}
          placeholder="e.g., 25000"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Currency */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
        <select
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="AED">AED</option>
          {/* Add more currencies as needed */}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
        <select
          id="condition"
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
      </div>

      {/* Mileage */}
      <div>
        <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mileage (km)</label>
        <input
          id="mileage"
          name="mileage"
          type="text"
          value={formData.mileage}
          onChange={handleChange}
          placeholder="e.g., 45000"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Exterior Color */}
      <div>
        <label htmlFor="exteriorColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exterior Color</label>
        <input
          id="exteriorColor"
          name="exteriorColor"
          type="text"
          value={formData.exteriorColor}
          onChange={handleChange}
          placeholder="e.g., Silver"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Interior Color */}
      <div>
        <label htmlFor="interiorColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interior Color</label>
        <input
          id="interiorColor"
          name="interiorColor"
          type="text"
          value={formData.interiorColor}
          onChange={handleChange}
          placeholder="e.g., Black"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Transmission */}
      <div>
        <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transmission</label>
        <select
          id="transmission"
          name="transmission"
          value={formData.transmission}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Fuel Type */}
      <div>
        <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuel Type</label>
        <select
          id="fuelType"
          name="fuelType"
          value={formData.fuelType}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="gasoline">Gasoline</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Features */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</label>
        <div className="grid grid-cols-2 gap-4">
          {carFeatures.map((feature) => (
            <div key={feature} className="flex items-center">
              <input
                type="checkbox"
                id={feature}
                checked={formData.features.includes(feature)}
                onChange={() => handleFeatureChange(feature)}
                className="mr-2"
              />
              <label htmlFor={feature} className="text-sm">{feature}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-700 dark:file:text-primary-50 dark:hover:file:bg-primary-600"
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {imagePreviewUrls.map((url, index) => (
            <div key={index} className="relative">
              <Image 
                src={url} 
                alt={`Uploaded image ${index + 1}`} 
                width={150}
                height={100}
                className="w-full h-auto rounded-md" 
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section for Listing Status and Expiry */}
      <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Listing Status & Expiry</h3>
        {formData.expires ? (
          <ListingExpiry
            listingId={id}
            expiryDate={formData.expires}
            status={formData.status as 'active' | 'expired' | 'pending'}
            onRenew={handleRenewal}
          />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Expiry date is not currently set for this listing.
          </p>
        )}
      </div>

      {/* Submit and Cancel buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/listings')}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
