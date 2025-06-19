// Reference data service
import { api } from './api';
import { getAuthHeaders } from '@/utils/auth';

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
  isActive: boolean;
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
 * Get all vehicle makes/brands
 */
export async function getVehicleMakes(): Promise<CarBrand[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await api.get<CarBrand[]>('/api/reference-data/brands', headers);
    return response || [];
  } catch (error) {
    console.error('Error fetching vehicle makes:', error);
    // Return a default list of common car makes as fallback
    return [
      { id: 1, name: 'Toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
      { id: 2, name: 'Honda', slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا', isActive: true },
      { id: 3, name: 'Ford', slug: 'ford', displayNameEn: 'Ford', displayNameAr: 'فورد', isActive: true },
      { id: 4, name: 'Nissan', slug: 'nissan', displayNameEn: 'Nissan', displayNameAr: 'نيسان', isActive: true },
      { id: 5, name: 'BMW', slug: 'bmw', displayNameEn: 'BMW', displayNameAr: 'بي إم دبليو', isActive: true },
      { id: 6, name: 'Mercedes', slug: 'mercedes', displayNameEn: 'Mercedes', displayNameAr: 'مرسيدس', isActive: true },
      { id: 7, name: 'Audi', slug: 'audi', displayNameEn: 'Audi', displayNameAr: 'أودي', isActive: true },
      { id: 8, name: 'Hyundai', slug: 'hyundai', displayNameEn: 'Hyundai', displayNameAr: 'هيونداي', isActive: true },
      { id: 9, name: 'Kia', slug: 'kia', displayNameEn: 'Kia', displayNameAr: 'كيا', isActive: true }
    ];
  }
}

/**
 * Get models for a specific make/brand
 * @param brandId The vehicle brand ID to get models for
 */
export async function getVehicleModels(brandId: number): Promise<CarModel[]> {
  if (!brandId) return [];
  
  try {
    const headers = await getAuthHeaders();
    const response = await api.get<CarModel[]>(
      `/api/reference-data/brands/${brandId}/models`,
      headers
    );
    return response || [];
  } catch (error) {
    console.error(`Error fetching models for brand ${brandId}:`, error);
    
    // Return default models based on popular car makes as fallback
    const defaultModels: Record<number, CarModel[]> = {
      1: [ // Toyota
        { id: 1, name: 'Camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', isActive: true },
        { id: 2, name: 'Corolla', slug: 'corolla', displayNameEn: 'Corolla', displayNameAr: 'كورولا', isActive: true },
        { id: 3, name: 'RAV4', slug: 'rav4', displayNameEn: 'RAV4', displayNameAr: 'رافـ4', isActive: true },
      ],
      2: [ // Honda
        { id: 4, name: 'Civic', slug: 'civic', displayNameEn: 'Civic', displayNameAr: 'سيفيك', isActive: true },
        { id: 5, name: 'Accord', slug: 'accord', displayNameEn: 'Accord', displayNameAr: 'أكورد', isActive: true },
        { id: 6, name: 'CR-V', slug: 'cr-v', displayNameEn: 'CR-V', displayNameAr: 'سي آر-في', isActive: true },
      ],
      3: [ // Ford
        { id: 7, name: 'F-150', slug: 'f-150', displayNameEn: 'F-150', displayNameAr: 'إف-150', isActive: true },
        { id: 8, name: 'Escape', slug: 'escape', displayNameEn: 'Escape', displayNameAr: 'إسكيب', isActive: true },
        { id: 9, name: 'Mustang', slug: 'mustang', displayNameEn: 'Mustang', displayNameAr: 'موستانغ', isActive: true },
      ]
    };
    
    return defaultModels[brandId] || [];
  }
}
