// Locations service
import { api } from './api';

export interface Location {
  id: number;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  region: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  active: boolean; // Backend returns 'active', not 'isActive'
  governorateId?: number;
  governorateNameEn?: string;
  governorateNameAr?: string;
}

/**
 * Get all active locations
 */
export async function getLocations(): Promise<Location[]> {
  try {
    return await api.get<Location[]>('/api/v1/locations');
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Get locations for a specific country
 * @param countryCode ISO country code (e.g. 'SY' for Syria)
 */
export async function getLocationsByCountry(countryCode: string): Promise<Location[]> {
  try {
    return await api.get<Location[]>(`/api/v1/locations/country/${countryCode}`);
  } catch (error) {
    console.error(`Error fetching locations for country ${countryCode}:`, error);
    return [];
  }
}

/**
 * Get locations for a specific governorate
 * @param governorateId The governorate ID
 */
export async function getLocationsByGovernorate(governorateId: number): Promise<Location[]> {
  try {
    return await api.get<Location[]>(`/api/v1/locations/governorate/${governorateId}`);
  } catch (error) {
    console.error(`Error fetching locations for governorate ${governorateId}:`, error);
    return [];
  }
}

/**
 * Get locations for a specific governorate by slug
 * @param governorateSlug The governorate slug
 */
export async function getLocationsByGovernorateSlug(governorateSlug: string): Promise<Location[]> {
  try {
    return await api.get<Location[]>(`/api/v1/locations/governorate/slug/${governorateSlug}`);
  } catch (error) {
    console.error(`Error fetching locations for governorate slug ${governorateSlug}:`, error);
    return [];
  }
}
