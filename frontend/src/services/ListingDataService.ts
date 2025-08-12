/**
 * Listing Data Service
 * 
 * Centralized service for handling data transformation between API and form formats.
 * This follows the best practice of separating data logic from UI components.
 */

import { ListingFormData, Listing } from '@/types/listings';
import { getMyListingById } from './listings';
import { getBrandIdByName, getModelIdByName } from '@/utils/lookupHelpers';

export class ListingDataService {
  /**
   * Load form data based on mode (create or edit)
   */
  static async loadFormData(
    mode: 'create' | 'edit',
    listingId?: string
  ): Promise<Partial<ListingFormData>> {
    if (mode === 'edit' && listingId) {
      return this.loadEditData(listingId);
    }
    return this.getCreateDefaults();
  }

  /**
   * Load and transform data for editing an existing listing
   */
  private static async loadEditData(listingId: string): Promise<Partial<ListingFormData>> {
    try {
      const listing = await getMyListingById(listingId);
      return await this.transformApiToForm(listing);
    } catch (error) {
      console.error('[ListingDataService] Error loading edit data:', error);
      throw new Error('Failed to load listing data for editing');
    }
  }

  /**
   * Get default values for creating a new listing
   */
  private static getCreateDefaults(): Partial<ListingFormData> {
    return {
      title: "",
      description: "",
      make: "",
      model: "",
      year: "",
      price: "",
      currency: "USD",
      mileage: "",
      engine: "",
      color: "",
      transmission: "",
      fuelType: "",
      exteriorColor: "",
      interiorColor: "",
      governorateSlug: "",
      locationSlug: "",
      state: "",
      zipCode: "",
      contactPhone: "",
      contactName: "",
      contactEmail: "",
      contactPreference: "phone",
      condition: "used",
      features: [],
      status: "active" as const,
      images: [],
      videos: [],
      videoUrls: [],
      categoryId: "1",
      existingImageUrls: [],
      existingVideoUrls: []
    };
  }

  /**
   * Transform API listing data to form format
   */
  private static async transformApiToForm(listing: Listing): Promise<Partial<ListingFormData>> {
    console.log('[ListingDataService] Transforming API data to form format');
    
    // Separate media by type
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    if (listing.media && Array.isArray(listing.media)) {
      listing.media.forEach((mediaItem) => {
        if (mediaItem.type?.startsWith('image/')) {
          imageUrls.push(mediaItem.url);
        } else if (mediaItem.type?.startsWith('video/') || 
                   mediaItem.url.includes('youtube') || 
                   mediaItem.url.includes('vimeo')) {
          videoUrls.push(mediaItem.url);
        }
      });
    }

    // Extract location information
    const locationName = listing.location?.city || listing.location?.address || "";
    const governorateName = listing.governorate?.nameEn || "";

    // Convert governorate name to slug (simple conversion for common names)
    const governorateSlug = governorateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Convert location name to slug (will be updated after locations load)
    const locationSlug = locationName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Convert brand and model names to IDs for the form
    const brandName = listing.brandNameEn || listing.brand || "";
    const modelName = listing.modelNameEn || listing.model || "";
    
    console.log('[ListingDataService] Converting brand/model names to IDs:', { brandName, modelName });

    let brandId = "";
    let modelId = "";

    try {
      if (brandName) {
        const foundBrandId = await getBrandIdByName(brandName);
        brandId = foundBrandId ? foundBrandId.toString() : "";
        console.log('[ListingDataService] Brand conversion:', brandName, '→', brandId);
      }

      if (brandId && modelName) {
        const foundModelId = await getModelIdByName(parseInt(brandId), modelName);
        modelId = foundModelId ? foundModelId.toString() : "";
        console.log('[ListingDataService] Model conversion:', modelName, '→', modelId);
      }
    } catch (error) {
      console.error('[ListingDataService] Error converting brand/model to IDs:', error);
    }

    // Build the form data object
    const formData: Partial<ListingFormData> = {
      id: listing.id,
      title: listing.title || "",
      description: listing.description || "",
      make: brandId,
      model: modelId,
      year: (listing.year || listing.modelYear)?.toString() || "",
      price: listing.price?.toString() || "",
      currency: listing.currency || "USD",
      condition: "used",
      mileage: listing.mileage?.toString() || "",
      engine: "", // Engine details not available in current API
      color: "", // Color not available in current API
      exteriorColor: "", // Exterior color not available in current API
      interiorColor: "", // Interior color not available in current API
      transmission: listing.transmission || "",
      fuelType: listing.fuelType || "",
      features: listing.features || [],
      categoryId: listing.category?.id || "",
      location: locationName,
      governorateSlug: governorateSlug,
      locationSlug: locationSlug,
      state: locationName,
      zipCode: "",
      contactName: listing.seller?.name || "",
      contactPhone: listing.seller?.phone || "",
      contactEmail: listing.seller?.email || "",
      contactPreference: "phone",
      images: [],
      videos: [],
      videoUrls: videoUrls,
              status: (listing.status as 'active' | 'pending' | 'sold' | 'expired') || 'active',
      existingImageUrls: imageUrls,
      existingVideoUrls: videoUrls.filter(url => 
        url.includes('youtube') || url.includes('vimeo')
      )
    };

    console.log('[ListingDataService] Transformation complete:', {
      hasTitle: !!formData.title,
      hasDescription: !!formData.description,
      hasMake: !!formData.make,
      hasModel: !!formData.model,
      hasYear: !!formData.year,
      hasPrice: !!formData.price,
      hasLocation: !!formData.location,
      hasGovernorate: !!formData.governorateSlug,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
      existingImageUrls: formData.existingImageUrls,
      existingVideoUrls: formData.existingVideoUrls
    });

    return formData;
  }

  /**
   * Validate form data before submission
   */
  static validateFormData(formData: Partial<ListingFormData>, _mode: 'create' | 'edit'): string[] {
    const errors: string[] = [];

    // Required fields validation
    if (!formData.title?.trim()) {
      errors.push('Title is required');
    }
    if (!formData.description?.trim()) {
      errors.push('Description is required');
    }
    if (!formData.make) {
      errors.push('Make is required');
    }
    if (!formData.model) {
      errors.push('Model is required');
    }
    if (!formData.year) {
      errors.push('Year is required');
    }
    if (!formData.price) {
      errors.push('Price is required');
    }
    if (!formData.governorateSlug) {
      errors.push('Governorate is required');
    }
    if (!formData.locationSlug) {
      errors.push('Location is required');
    }

    // Images validation (at least 1 required)
    const totalImages = (formData.images?.length || 0) + (formData.existingImageUrls?.length || 0);
    if (totalImages === 0) {
      errors.push('At least one image is required');
    }

    return errors;
  }
}
