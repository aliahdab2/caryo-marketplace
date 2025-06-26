/**
 * Interface for car make/brand
 */
export interface CarMake {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  isActive: boolean;
  listingCount?: number; // Optional count of listings for this brand
  models?: CarModel[];
}

/**
 * Interface for car model
 */
export interface CarModel {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  isActive: boolean;
  listingCount?: number; // Optional count of listings for this model
  brand?: CarMake;
  trims?: CarTrim[];
}

/**
 * Interface for car trim
 */
export interface CarTrim {
  id: number;
  name: string;
  model?: CarModel;
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
