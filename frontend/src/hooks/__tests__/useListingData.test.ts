import { renderHook, waitFor } from '@testing-library/react';
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

const mockFetchGovernorates = fetchGovernorates as jest.MockedFunction<typeof fetchGovernorates>;
const mockGetLocationsByGovernorateSlug = getLocationsByGovernorateSlug as jest.MockedFunction<typeof getLocationsByGovernorateSlug>;

// Mock data
const mockGovernorates = [
  { id: 1, displayNameEn: 'Test Governorate', displayNameAr: 'محافظة تست', slug: 'test-gov' },
];

const mockLocations = [
  {
    id: 1,
    displayNameEn: 'Test Location',
    displayNameAr: 'موقع تست',
    slug: 'test-location',
    governorateId: 1,
    region: 'Test Region',
    countryCode: 'SY',
    active: true
  },
];

const mockCarMakes = [
  { id: 1, nameEn: 'Toyota', nameAr: 'تويوتا' },
  { id: 2, nameEn: 'BMW', nameAr: 'بي إم دبليو' },
];

const mockCarModels = [
  { id: 1, nameEn: 'Camry', nameAr: 'كامري', makeId: 1 },
  { id: 2, nameEn: 'Corolla', nameAr: 'كورولا', makeId: 1 },
];

const mockReferenceData = {
  transmissions: [
    { id: 1, nameEn: 'Manual', nameAr: 'يدوي' },
    { id: 2, nameEn: 'Automatic', nameAr: 'أوتوماتيك' },
  ],
  fuelTypes: [
    { id: 1, nameEn: 'Petrol', nameAr: 'بنزين' },
    { id: 2, nameEn: 'Diesel', nameAr: 'ديزل' },
  ],
};

describe('useListingData', () => {
  const mockT = jest.fn((key: string) => key);

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFetchGovernorates.mockResolvedValue(mockGovernorates);
    mockGetLocationsByGovernorateSlug.mockResolvedValue(mockLocations);

    // Mock the dynamic imports
    jest.doMock('@/services/referenceData', () => ({
      getVehicleMakes: jest.fn().mockResolvedValue(mockCarMakes),
      getVehicleModels: jest.fn().mockResolvedValue(mockCarModels),
      getCarReferenceData: jest.fn().mockResolvedValue(mockReferenceData),
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useListingData(mockT));

    expect(result.current.governorates).toEqual([]);
    expect(result.current.locations).toEqual([]);
    expect(result.current.carMakes).toEqual([]);
    expect(result.current.carModels).toEqual([]);
    expect(result.current.transmissions).toEqual([]);
    expect(result.current.fuelTypes).toEqual([]);
    expect(result.current.isLoadingGovernorates).toBe(true);
    expect(result.current.isLoadingLocations).toBe(false);
    expect(result.current.isLoadingMakes).toBe(true);
    expect(result.current.isLoadingModels).toBe(false);
    expect(result.current.isLoadingReferenceData).toBe(true);
  });

  it('should load initial data on mount', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    await waitFor(() => {
      expect(result.current.isLoadingGovernorates).toBe(false);
      expect(result.current.isLoadingMakes).toBe(false);
      expect(result.current.isLoadingReferenceData).toBe(false);
    });

    expect(mockFetchGovernorates).toHaveBeenCalledTimes(1);
    expect(result.current.governorates).toEqual(mockGovernorates);
  });

  it('should load car models when loadCarModels is called', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.isLoadingMakes).toBe(false);
    });

    // Test loading models
    await result.current.loadCarModels('1');

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
      expect(result.current.carModels).toEqual(mockCarModels);
    });
  });

  it('should load locations when loadLocations is called', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current.isLoadingGovernorates).toBe(false);
    });

    // Test loading locations
    const locationResult = await result.current.loadLocations('test-gov');

    await waitFor(() => {
      expect(result.current.isLoadingLocations).toBe(false);
      expect(result.current.locations).toEqual(mockLocations);
    });

    expect(locationResult.locationData).toEqual(mockLocations);
    expect(locationResult.governorateId).toBe(1);
    expect(mockGetLocationsByGovernorateSlug).toHaveBeenCalledWith('test-gov');
  });

  it('should clear models when clearModels is called', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    // Load some models first
    await result.current.loadCarModels('1');

    await waitFor(() => {
      expect(result.current.carModels.length).toBeGreaterThan(0);
    });

    // Clear models
    result.current.clearModels();

    await waitFor(() => {
      expect(result.current.carModels).toEqual([]);
      expect(result.current.isLoadingModels).toBe(false);
    });
  });

  it('should clear locations when clearLocations is called', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    // Load some locations first
    await result.current.loadLocations('test-gov');

    await waitFor(() => {
      expect(result.current.locations.length).toBeGreaterThan(0);
    });

    // Clear locations
    result.current.clearLocations();

    await waitFor(() => {
      expect(result.current.locations).toEqual([]);
      expect(result.current.isLoadingLocations).toBe(false);
    });
  });

  it('should handle empty make ID in loadCarModels', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    await result.current.loadCarModels('');

    expect(result.current.carModels).toEqual([]);
    expect(result.current.isLoadingModels).toBe(false);
  });

  it('should handle empty governorate slug in loadLocations', async () => {
    const { result } = renderHook(() => useListingData(mockT));

    const locationResult = await result.current.loadLocations('');

    expect(result.current.locations).toEqual([]);
    expect(result.current.isLoadingLocations).toBe(false);
    expect(locationResult.locationData).toEqual([]);
    expect(locationResult.governorateId).toBeUndefined();
  });

  it('should handle errors in loadCarModels', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the dynamic import to reject
    jest.doMock('@/services/referenceData', () => ({
      getVehicleMakes: jest.fn().mockResolvedValue(mockCarMakes),
      getVehicleModels: jest.fn().mockRejectedValue(new Error('API Error')),
      getCarReferenceData: jest.fn().mockResolvedValue(mockReferenceData),
    }));

    const { result } = renderHook(() => useListingData(mockT));

    await expect(result.current.loadCarModels('1')).rejects.toThrow('common:failedToLoadData');

    await waitFor(() => {
      expect(result.current.isLoadingModels).toBe(false);
    });

    consoleSpy.mockRestore();
  });

  it('should handle errors in loadLocations', async () => {
    mockGetLocationsByGovernorateSlug.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useListingData(mockT));

    await expect(result.current.loadLocations('test-gov')).rejects.toThrow('common:failedToLoadData');

    await waitFor(() => {
      expect(result.current.isLoadingLocations).toBe(false);
    });
  });
});
