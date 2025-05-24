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
  isActive: boolean;
}

/**
 * Get all active locations
 */
export async function getLocations(): Promise<Location[]> {
  try {
    return await api.get<Location[]>('/api/locations');
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
    return await api.get<Location[]>(`/api/locations/country/${countryCode}`);
  } catch (error) {
    console.error(`Error fetching locations for country ${countryCode}:`, error);
    return [];
  }
}
