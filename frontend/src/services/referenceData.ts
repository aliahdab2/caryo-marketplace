// Reference data service
import { api } from './api';

export interface ReferenceDataItem {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

export interface ReferenceData {
  carConditions: ReferenceDataItem[];
  driveTypes: ReferenceDataItem[];
  bodyStyles: ReferenceDataItem[];
  fuelTypes: ReferenceDataItem[];
  transmissions: ReferenceDataItem[];
  sellerTypes: ReferenceDataItem[];
}

/**
 * Get all car reference data (conditions, drive types, body styles, etc.)
 */
export async function getCarReferenceData(): Promise<ReferenceData> {
  try {
    return await api.get<ReferenceData>('/api/reference-data');
  } catch (error) {
    console.error('Error fetching reference data:', error);
    // Return empty data on error
    return {
      carConditions: [],
      driveTypes: [],
      bodyStyles: [],
      fuelTypes: [],
      transmissions: [],
      sellerTypes: []
    };
  }
}

/**
 * Get all vehicle makes
 */
export async function getVehicleMakes(): Promise<string[]> {
  try {
    const response = await api.get<{ makes: string[] }>('/api/vehicle-makes');
    return response.makes || [];
  } catch (error) {
    console.error('Error fetching vehicle makes:', error);
    return [];
  }
}

/**
 * Get models for a specific make
 * @param make The vehicle make to get models for
 */
export async function getVehicleModels(make: string): Promise<string[]> {
  if (!make) return [];
  
  try {
    const response = await api.get<{ models: string[] }>(`/api/vehicle-models?make=${encodeURIComponent(make)}`);
    return response.models || [];
  } catch (error) {
    console.error(`Error fetching models for make ${make}:`, error);
    return [];
  }
}
