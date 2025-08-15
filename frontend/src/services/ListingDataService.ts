/**
 * Listing Data Service
 * 
 * Centralized service for handling data transformation between API and form formats.
 * This follows the best practice of separating data logic from UI components.
 */

import { ListingFormData, Listing } from '@/types/listings';
import { getMyListingById } from './listings';
// Using database data directly - no conversion helpers needed

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
      console.log('[ListingDataService] Raw listing data:', {
        id: listing.id,
        title: listing.title,
        // V3: Debug contact fields loading
        contactName: listing.contactName,
        contactEmail: listing.contactEmail,
        contactPhone: listing.contactPhone,
        contactPreference: listing.contactPreference,
        hasContactFields: !!(listing.contactName || listing.contactEmail || listing.contactPhone)
      });
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

    // Extract location information and IDs (following the established location pattern)
    const locationName = listing.location?.city || listing.location?.address || "";
    const governorateName = listing.governorate?.nameEn || "";

    // Get IDs and slugs from details objects (like location pattern)
    const governorateSlug = listing.governorateDetails?.slug || governorateName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const governorateId = listing.governorateDetails?.id;
    const locationSlug = listing.locationDetails?.slug || locationName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const locationId = listing.locationDetails?.id;

    // V2: Direct access to complete objects (no conversion needed!)
    // The backend now provides complete objects with IDs, slugs, and display names
    const brand = listing.brand;
    const model = listing.model;
    const transmission = listing.transmission;
    const fuelType = listing.fuelType;

    console.log('[ListingDataService] Using enhanced V2 object data:', {
      brand: brand?.displayNameEn,
      brandSlug: brand?.slug,
      brandId: brand?.id,
      model: model?.displayNameEn,
      modelSlug: model?.slug,
      modelId: model?.id,
      transmission: transmission?.displayNameEn,
      transmissionSlug: transmission?.slug,
      transmissionId: transmission?.id,
      fuelType: fuelType?.displayNameEn,
      fuelTypeSlug: fuelType?.slug,
      fuelTypeId: fuelType?.id,
      governorateId: governorateId,
      locationId: locationId
    });

    // Build the form data object
    const formData: Partial<ListingFormData> = {
      id: listing.id,
      title: listing.title || "",
      description: listing.description || "",
      // V2: Use slugs directly from complete objects (no conversion needed!)
      make: brand?.slug || "",
      model: model?.slug || "",
      
      // Store IDs directly from complete objects (available immediately!)
      makeId: brand?.id,
      modelId: model?.id,
      year: (listing.year || listing.modelYear)?.toString() || "",
      price: listing.price?.toString() || "",
      currency: listing.currency || "USD",
      condition: "used",
      mileage: listing.mileage?.toString() || "",
      engine: "", // Engine details not available in current API
      color: "", // Color not available in current API
      exteriorColor: "", // Exterior color not available in current API
      interiorColor: "", // Interior color not available in current API
      transmission: transmission?.slug || "",
      fuelType: fuelType?.slug || "",
      
      // Store IDs for efficient API calls
      transmissionId: transmission?.id,
      fuelTypeId: fuelType?.id,
      features: listing.features || [],
      categoryId: listing.category?.id || "",
      location: locationName,
      governorateSlug: governorateSlug,
      locationSlug: locationSlug,
      // Include IDs for efficient API calls (following location pattern)
      governorateId: governorateId,
      locationId: locationId,
      state: locationName,
      zipCode: "",
      // V3: Use direct contact fields from listing (not seller defaults)
      contactName: listing.contactName || "",
      contactPhone: listing.contactPhone || "",
      contactEmail: listing.contactEmail || "",
      contactPreference: listing.contactPreference || "email",
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
      existingVideoUrls: formData.existingVideoUrls,
      // V3: Contact fields debug
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      contactPreference: formData.contactPreference,
      hasContactInfo: !!(formData.contactName || formData.contactEmail || formData.contactPhone)
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
