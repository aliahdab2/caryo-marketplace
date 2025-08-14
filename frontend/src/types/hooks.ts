/**
 * Types and interfaces for custom hooks
 */

import { CarBrand, CarModel } from './referenceData';
import { Transmission, FuelType } from './wizard';
import { Governorate } from '../services/api';
import { Location } from '../services/locations';

/**
 * Return type for useListingData hook
 */
export interface UseListingDataReturn {
  // Data states
  governorates: Governorate[];
  locations: Location[];
  carMakes: CarBrand[];
  carModels: CarModel[];
  transmissions: Transmission[];
  fuelTypes: FuelType[];

  // Loading states
  isLoadingGovernorates: boolean;
  isLoadingLocations: boolean;
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  isLoadingReferenceData: boolean;

  // Actions
  loadCarModels: (makeId: string) => Promise<void>;
  loadLocations: (governorateSlug: string) => Promise<{ locationData: Location[]; governorateId?: number }>;
  clearModels: () => void;
  clearLocations: () => void;
}
