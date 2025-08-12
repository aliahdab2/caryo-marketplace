/**
 * Reference data types for vehicles, locations, etc.
 */

export interface CarBrand {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  isActive: boolean;
}

export interface CarModel {
  id: number;
  name: string;
  slug: string;
  displayNameEn: string;
  displayNameAr: string;
  brandId: number;
  isActive: boolean;
}

export interface ReferenceDataItem {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

export interface ReferenceData {
  transmissions?: ReferenceDataItem[];
  fuelTypes?: ReferenceDataItem[];
  bodyStyles?: ReferenceDataItem[];
  colors?: ReferenceDataItem[];
}
