"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ListingFormData, UpdateListingData } from '@/types/listings';
import { Governorate, fetchGovernorates } from '@/services/api';
import { getListingById, updateListing } from '@/services/listings';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
import ListingExpiry from "../../components/ListingExpiry";

// Client component
export default function EditListingPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingListing, setIsLoadingListing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Store image object URLs for preview
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

  // Available car features
  const carFeatures = [
    "airConditioning", "leatherSeats", "sunroof", "navigation",
    "bluetoothConnectivity", "parkingSensors", "reverseCam",
    "cruiseControl", "alloyWheels", "electricWindows"
  ];

  useEffect(() => {
    // Load listing data and governorates
    const loadData = async () => {
      try {
        setIsLoadingListing(true);
        setIsLoadingGovernorates(true);
        setError(null);

        // Load listing data
        const listing = await getListingById(id);
        
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
          exteriorColor: "",
          interiorColor: "",
          transmission: listing.transmission || "",
          fuelType: listing.fuelType || "",
          features: listing.features || [],
          location: listing.location?.city || "",
          governorateId: "1", // This needs to be mapped from the location data
          city: listing.location?.city || "",
          contactName: listing.seller?.name || "",
          contactPhone: listing.seller?.phone || "",
          contactEmail: listing.seller?.email || "",
          contactPreference: "both",
          images: [], // Images from API are URLs, not File objects
          status: (listing.status === "sold" ? "active" : listing.status) || "active",
          categoryId: "",
          attributes: {}
        };

        setFormData(listingFormData);
        setIsLoadingListing(false);

        // Load governorates
        const fetchedGovernorates = await fetchGovernorates();
        setGovernorates(fetchedGovernorates);
        setIsLoadingGovernorates(false);
      } catch (err) {
        console.error("Failed to fetch listing data", err);
        setError("Failed to load listing data. Please try again.");
        setIsLoadingListing(false);
        setIsLoadingGovernorates(false);
      }
    };

    loadData();
  }, [id]);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
  };

  // Handle checkbox change for features
  const handleFeatureChange = (feature: string) => {
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
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      };
    });
  };

  // Submit form
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData) {
      setError("Form data is not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare the update data according to backend API requirements
      const updateData: UpdateListingData = {
        title: formData.title,
        // modelId: // Need to map from make/model to modelId
        modelYear: parseInt(formData.year) || undefined,
        mileage: parseInt(formData.mileage) || undefined,
        price: parseFloat(formData.price) || undefined,
        currency: formData.currency || undefined,
        // locationId: // Need to map from location to locationId
        description: formData.description,
        transmission: formData.transmission,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateListingData] === undefined) {
          delete updateData[key as keyof UpdateListingData];
        }
      });

      console.log("Updating listing with data:", updateData);
      
      await updateListing(id, updateData);
      
      // Redirect to listings page after successful update
      router.push("/dashboard/listings");
    } catch (error) {
      console.error("Error updating listing:", error);
      setError(error instanceof Error ? error.message : "Failed to update listing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle listing renewal
  const handleRenewal = (id: string, duration: number) => {
    // In a real app, perform API call to renew listing
    console.log(`Renewing listing ${id} for ${duration} days`);

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
  };

  // Show loading state while fetching data
  if (isLoadingListing || isLoadingGovernorates) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading listing data...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-2xl mx-auto">
        <div className="text-red-600 dark:text-red-400 text-lg mb-2">⚠️ Error</div>
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show error if formData is null
  if (!formData) {
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
          {SUPPORTED_CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
          ))}
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
