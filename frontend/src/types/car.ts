/**
 * Interface for car make/brand (updated to match DTO structure)
 */
export interface CarMake {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  isActive: boolean;
  // Removed models array - no longer included in API response
}

/**
 * Interface for car model (updated to match DTO structure)
 */
export interface CarModel {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  isActive: boolean;
  brandId: number; // Added brandId reference instead of full brand object
  // Removed brand object and trims array - no longer included in API response
}

/**
 * Interface for car trim
 */
export interface CarTrim {
  id: number;
  name: string;
  modelId?: number; // Reference to model instead of full model object
}

/**
 * Interface for reference data item
 */
export interface ReferenceDataItem {
  id: string | number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

/**
 * Interface for all reference data
 */
export interface ReferenceData {
  conditions: ReferenceDataItem[];
  transmissions: ReferenceDataItem[];
  fuelTypes: ReferenceDataItem[];
  bodyStyles: ReferenceDataItem[];
}
