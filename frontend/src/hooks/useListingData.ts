import { useState, useEffect, useCallback } from 'react';
import { CarBrand, CarModel } from '@/types/referenceData';
import { Transmission, FuelType } from '@/types/wizard';
import { Governorate, fetchGovernorates } from '@/services/api';
import { getLocationsByGovernorateSlug, Location } from '@/services/locations';
import { createLogger } from '@/utils/logger';
import { UseListingDataReturn } from '@/types/hooks';

const wizardLogger = createLogger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_WIZARD === 'true',
  level: 'debug',
  prefix: 'LISTING_DATA'
});

// Lazy import for reference data services to reduce initial bundle
const referenceDataServices = {
  getVehicleMakes: () => import('@/services/referenceData').then(m => m.getVehicleMakes),
  getVehicleModels: () => import('@/services/referenceData').then(m => m.getVehicleModels),
  getCarReferenceData: () => import('@/services/referenceData').then(m => m.getCarReferenceData),
};

export function useListingData(t: (key: string) => string): UseListingDataReturn {
  // State management
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [carMakes, setCarMakes] = useState<CarBrand[]>([]);
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingMakes, setIsLoadingMakes] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(true);

  // Load car models
  const loadCarModels = useCallback(async (makeId: string) => {
    if (!makeId || makeId.trim() === '') {
      setCarModels([]);
      return;
    }

    // Validate that makeId is a valid number
    const parsedMakeId = parseInt(makeId);
    if (isNaN(parsedMakeId)) {
      setCarModels([]);
      return;
    }

    try {
      setIsLoadingModels(true);
      setCarModels([]); // Clear previous models
      const getVehicleModels = await referenceDataServices.getVehicleModels();
      const modelData = await getVehicleModels(parsedMakeId);
      setCarModels(modelData);
      wizardLogger.debug(`Loaded ${modelData.length} models for make ID: ${makeId}`);
    } catch (error) {
      wizardLogger.error('Failed to load car models:', error);
      throw new Error(t('common:failedToLoadData'));
    } finally {
      setIsLoadingModels(false);
    }
  }, [t]);

  // Load locations by governorate
  const loadLocations = useCallback(async (governorateSlug: string) => {
    if (!governorateSlug || governorateSlug.trim() === '') {
      setLocations([]);
      return { locationData: [] };
    }

    try {
      setIsLoadingLocations(true);
      setLocations([]); // Clear previous locations
      wizardLogger.debug('Loading locations for governorate: ' + governorateSlug);
      
      const locationData = await getLocationsByGovernorateSlug(governorateSlug);
      setLocations(locationData);
      
      wizardLogger.debug(`Loaded ${locationData.length} locations`);
      
      // Return governorate ID if available
      const governorateId = locationData.length > 0 ? locationData[0].governorateId : undefined;
      
      return { locationData, governorateId };
    } catch (error) {
      wizardLogger.error('Failed to load locations:', error);
      throw new Error(t('common:failedToLoadData'));
    } finally {
      setIsLoadingLocations(false);
    }
  }, [t]);

  // Clear models
  const clearModels = useCallback(() => {
    setCarModels([]);
    setIsLoadingModels(false);
  }, []);

  // Clear locations
  const clearLocations = useCallback(() => {
    setLocations([]);
    setIsLoadingLocations(false);
  }, []);

  // Load initial data (governorates and makes)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingGovernorates(true);
        setIsLoadingMakes(true);
        setIsLoadingReferenceData(true);

        // Load governorates
        const governorateData = await fetchGovernorates();
        setGovernorates(governorateData);
        wizardLogger.debug(`Loaded ${governorateData.length} governorates`);

        // Load car makes and reference data
        const [getVehicleMakes, getCarReferenceData] = await Promise.all([
          referenceDataServices.getVehicleMakes(),
          referenceDataServices.getCarReferenceData(),
        ]);

        const [makesData, referenceData] = await Promise.all([
          getVehicleMakes(),
          getCarReferenceData(),
        ]);

        setCarMakes(makesData);
        setTransmissions(referenceData.transmissions);
        setFuelTypes(referenceData.fuelTypes);

        wizardLogger.debug(`Loaded ${makesData.length} car makes`);
        wizardLogger.debug(`Loaded ${referenceData.transmissions.length} transmissions`);
        wizardLogger.debug(`Loaded ${referenceData.fuelTypes.length} fuel types`);

      } catch (error) {
        wizardLogger.error('Failed to load initial data:', error);
      } finally {
        setIsLoadingGovernorates(false);
        setIsLoadingMakes(false);
        setIsLoadingReferenceData(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    governorates,
    locations,
    carMakes,
    carModels,
    transmissions,
    fuelTypes,
    isLoadingGovernorates,
    isLoadingLocations,
    isLoadingMakes,
    isLoadingModels,
    isLoadingReferenceData,
    loadCarModels,
    loadLocations,
    clearModels,
    clearLocations,
  };
}
