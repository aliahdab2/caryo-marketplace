/**
 * Helper functions for converting display names to IDs for API calls
 * 
 * This file contains only the lookup functions that are actively used
 * in the application, specifically for edit mode data transformation.
 */

import { getVehicleMakes, getVehicleModels } from '@/services/referenceData';

/**
 * Find brand ID by display name
 * Used in ListingDataService for converting API brand names to form IDs
 */
export async function getBrandIdByName(brandName: string): Promise<number | null> {
  try {
    const brands = await getVehicleMakes();
    const brand = brands.find(b => 
      b.displayNameEn.toLowerCase() === brandName.toLowerCase() ||
      b.name.toLowerCase() === brandName.toLowerCase()
    );
    return brand ? brand.id : null;
  } catch (error) {
    console.error('Error finding brand ID:', error);
    return null;
  }
}

/**
 * Find model ID by brand ID and model display name
 * Used in ListingDataService for converting API model names to form IDs
 */
export async function getModelIdByName(brandId: number, modelName: string): Promise<number | null> {
  try {
    const models = await getVehicleModels(brandId);
    const model = models.find(m => 
      m.displayNameEn.toLowerCase() === modelName.toLowerCase() ||
      m.name.toLowerCase() === modelName.toLowerCase()
    );
    return model ? model.id : null;
  } catch (error) {
    console.error('Error finding model ID:', error);
    return null;
  }
}