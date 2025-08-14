import { renderHook, waitFor, act } from '@testing-library/react';
import { useListingData } from '../useListingData';

// Mock the external dependencies
jest.mock('@/services/api', () => ({
  fetchGovernorates: jest.fn(),
}));

jest.mock('@/services/locations', () => ({
  getLocationsByGovernorateSlug: jest.fn(),
}));

jest.mock('@/services/referenceData', () => ({
  getVehicleMakes: jest.fn(),
  getVehicleModels: jest.fn(),
  getCarReferenceData: jest.fn(),
}));

jest.mock('@/utils/logger', () => ({
  createLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchGovernorates } from '@/services/api';
import { getLocationsByGovernorateSlug } from '@/services/locations';
import { getVehicleMakes, getVehicleModels, getCarReferenceData } from '@/services/referenceData';

const mockFetchGovernorates = fetchGovernorates as jest.MockedFunction<typeof fetchGovernorates>;
const mockGetLocationsByGovernorateSlug = getLocationsByGovernorateSlug as jest.MockedFunction<typeof getLocationsByGovernorateSlug>;
const mockGetVehicleMakes = getVehicleMakes as jest.MockedFunction<typeof getVehicleMakes>;
const mockGetVehicleModels = getVehicleModels as jest.MockedFunction<typeof getVehicleModels>;
const mockGetCarReferenceData = getCarReferenceData as jest.MockedFunction<typeof getCarReferenceData>;

describe('useListingData - Comprehensive Tests', () => {
  const mockT = (key: string) => key;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial data loading', () => {
    it('should load all initial data on mount', async () => {
      const mockGovernorates = [
        { id: 1, displayNameEn: 'Damascus', displayNameAr: 'دمشق', slug: 'damascus' }
      ];
      const mockMakes = [
        { id: 1, name: 'toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true }
      ];
      const mockReferenceData = {
        transmissions: [
          { id: 1, name: 'manual', slug: 'manual', displayNameEn: 'Manual', displayNameAr: 'يدوي' }
        ],
        fuelTypes: [
          { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' }
        ],
        carConditions: [],
        driveTypes: [],
        bodyStyles: [],
        sellerTypes: []
      };

      mockFetchGovernorates.mockResolvedValue(mockGovernorates);
      mockGetVehicleMakes.mockResolvedValue(mockMakes);
      mockGetCarReferenceData.mockResolvedValue(mockReferenceData);

      const { result } = renderHook(() => useListingData(mockT));

      // Initially loading
      expect(result.current.isLoadingGovernorates).toBe(true);
      expect(result.current.isLoadingMakes).toBe(true);
      expect(result.current.isLoadingReferenceData).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoadingGovernorates).toBe(false);
        expect(result.current.isLoadingMakes).toBe(false);
        expect(result.current.isLoadingReferenceData).toBe(false);
      });

      expect(result.current.governorates).toEqual(mockGovernorates);
      expect(result.current.carMakes).toEqual(mockMakes);
      expect(result.current.transmissions).toEqual(mockReferenceData.transmissions);
      expect(result.current.fuelTypes).toEqual(mockReferenceData.fuelTypes);
    });

    it('should handle errors during initial loading', async () => {
      mockFetchGovernorates.mockRejectedValue(new Error('API Error'));
      mockGetVehicleMakes.mockRejectedValue(new Error('API Error'));
      mockGetCarReferenceData.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useListingData(mockT));

      await waitFor(() => {
        expect(result.current.isLoadingGovernorates).toBe(false);
        expect(result.current.isLoadingMakes).toBe(false);
        expect(result.current.isLoadingReferenceData).toBe(false);
      });

      expect(result.current.governorates).toEqual([]);
      expect(result.current.carMakes).toEqual([]);
      expect(result.current.transmissions).toEqual([]);
      expect(result.current.fuelTypes).toEqual([]);
    });
  });

  describe('Car models loading', () => {
    it('should load models when make ID is provided', async () => {
      const mockModels = [
        { id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1, isActive: true }
      ];

      mockGetVehicleModels.mockResolvedValue(mockModels);

      const { result } = renderHook(() => useListingData(mockT));

      await act(async () => {
        await result.current.loadCarModels('1');
      });

      expect(mockGetVehicleModels).toHaveBeenCalledWith(1);
      expect(result.current.carModels).toEqual(mockModels);
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('should handle invalid make ID', async () => {
      const { result } = renderHook(() => useListingData(mockT));

      await act(async () => {
        await result.current.loadCarModels('invalid');
      });

      expect(mockGetVehicleModels).not.toHaveBeenCalled();
      expect(result.current.carModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('should handle API error when loading models', async () => {
      mockGetVehicleModels.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useListingData(mockT));

      await act(async () => {
        await expect(result.current.loadCarModels('1')).rejects.toThrow('common:failedToLoadData');
      });

      expect(result.current.carModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
    });

    it('should clear models when requested', async () => {
      const mockModels = [
        { id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1, isActive: true }
      ];

      mockGetVehicleModels.mockResolvedValue(mockModels);

      const { result } = renderHook(() => useListingData(mockT));

      // First load models
      await act(async () => {
        await result.current.loadCarModels('1');
      });

      expect(result.current.carModels).toEqual(mockModels);

      // Then clear them
      act(() => {
        result.current.clearModels();
      });

      await waitFor(() => {
        expect(result.current.carModels).toEqual([]);
        expect(result.current.isLoadingModels).toBe(false);
      });
    });
  });

  describe('Locations loading', () => {
    it('should load locations for a governorate', async () => {
      const mockLocations = [
        { id: 1, displayNameEn: 'Damascus Center', displayNameAr: 'دمشق المركز', slug: 'damascus-center', governorateId: 1 }
      ];

      mockGetLocationsByGovernorateSlug.mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useListingData(mockT));

      let resultData;
      await act(async () => {
        resultData = await result.current.loadLocations('damascus');
      });

      expect(mockGetLocationsByGovernorateSlug).toHaveBeenCalledWith('damascus');
      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.isLoadingLocations).toBe(false);
      expect(resultData).toEqual({
        locationData: mockLocations,
        governorateId: 1
      });
    });

    it('should handle empty locations result', async () => {
      mockGetLocationsByGovernorateSlug.mockResolvedValue([]);

      const { result } = renderHook(() => useListingData(mockT));

      let resultData;
      await act(async () => {
        resultData = await result.current.loadLocations('unknown-governorate');
      });

      expect(result.current.locations).toEqual([]);
      expect(resultData).toEqual({
        locationData: [],
        governorateId: undefined
      });
    });

    it('should handle API error when loading locations', async () => {
      mockGetLocationsByGovernorateSlug.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useListingData(mockT));

      await act(async () => {
        await expect(result.current.loadLocations('damascus')).rejects.toThrow('common:failedToLoadData');
      });

      expect(result.current.locations).toEqual([]);
      expect(result.current.isLoadingLocations).toBe(false);
    });

    it('should clear locations when requested', async () => {
      const mockLocations = [
        { id: 1, displayNameEn: 'Damascus Center', displayNameAr: 'دمشق المركز', slug: 'damascus-center', governorateId: 1 }
      ];

      mockGetLocationsByGovernorateSlug.mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useListingData(mockT));

      // First load locations
      await act(async () => {
        await result.current.loadLocations('damascus');
      });

      expect(result.current.locations).toEqual(mockLocations);

      // Then clear them
      act(() => {
        result.current.clearLocations();
      });

      await waitFor(() => {
        expect(result.current.locations).toEqual([]);
        expect(result.current.isLoadingLocations).toBe(false);
      });
    });
  });

  describe('Loading states management', () => {
    it('should manage loading states correctly during concurrent operations', async () => {
      const mockModels = [{ id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1, isActive: true }];
      const mockLocations = [{ id: 1, displayNameEn: 'Damascus Center', displayNameAr: 'دمشق المركز', slug: 'damascus-center', governorateId: 1 }];

      // Create delayed promises to test loading states
      let resolveModels: (value: any) => void;
      let resolveLocations: (value: any) => void;

      const modelsPromise = new Promise(resolve => { resolveModels = resolve; });
      const locationsPromise = new Promise(resolve => { resolveLocations = resolve; });

      mockGetVehicleModels.mockReturnValue(modelsPromise as any);
      mockGetLocationsByGovernorateSlug.mockReturnValue(locationsPromise as any);

      const { result } = renderHook(() => useListingData(mockT));

      // Start both operations
      act(() => {
        result.current.loadCarModels('1');
        result.current.loadLocations('damascus');
      });

      // Both should be loading
      expect(result.current.isLoadingModels).toBe(true);
      expect(result.current.isLoadingLocations).toBe(true);

      // Resolve models first
      act(() => {
        resolveModels!(mockModels);
      });

      await waitFor(() => {
        expect(result.current.isLoadingModels).toBe(false);
        expect(result.current.isLoadingLocations).toBe(true); // Still loading
      });

      // Resolve locations
      act(() => {
        resolveLocations!(mockLocations);
      });

      await waitFor(() => {
        expect(result.current.isLoadingModels).toBe(false);
        expect(result.current.isLoadingLocations).toBe(false);
      });

      expect(result.current.carModels).toEqual(mockModels);
      expect(result.current.locations).toEqual(mockLocations);
    });
  });
});
