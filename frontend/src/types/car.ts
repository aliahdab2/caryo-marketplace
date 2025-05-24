/**
 * Interface for car make/brand
 */
export interface CarMake {
  id: string;
  name: string;
}

/**
 * Interface for car model
 */
export interface CarModel {
  id: string;
  name: string;
  makeId: string;
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
