import { createListing } from '../listings';
import { api } from '../api';
import { getCarReferenceData, getVehicleMakes, getVehicleModels } from '../referenceData';

// Mock dependencies
jest.mock('../api');
jest.mock('../referenceData');
jest.mock('@/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' })
}));

// Mock global fetch
global.fetch = jest.fn();

const mockApi = api as jest.Mocked<typeof api>;
const mockGetCarReferenceData = getCarReferenceData as jest.MockedFunction<typeof getCarReferenceData>;
const mockGetVehicleMakes = getVehicleMakes as jest.MockedFunction<typeof getVehicleMakes>;
const mockGetVehicleModels = getVehicleModels as jest.MockedFunction<typeof getVehicleModels>;
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Listings Service - Data Conversion Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createListing - Slug to ID Conversion', () => {
    const mockReferenceData = {
      transmissions: [
        { id: 1, name: 'manual', slug: 'manual', displayNameEn: 'Manual', displayNameAr: 'يدوي' },
        { id: 2, name: 'automatic', slug: 'automatic', displayNameEn: 'Automatic', displayNameAr: 'أوتوماتيكي' }
      ],
      fuelTypes: [
        { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' },
        { id: 2, name: 'diesel', slug: 'diesel', displayNameEn: 'Diesel', displayNameAr: 'ديزل' }
      ],
      carConditions: [],
      driveTypes: [],
      bodyStyles: [],
      sellerTypes: []
    };

    const mockBrands = [
      { id: 1, name: 'toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
      { id: 2, name: 'honda', slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا', isActive: true }
    ];

    const mockModels = [
      { id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1, isActive: true },
      { id: 102, name: 'corolla', slug: 'corolla', displayNameEn: 'Corolla', displayNameAr: 'كورولا', brandId: 1, isActive: true }
    ];

    const mockLocation = { id: 123, name: 'Damascus Center', slug: 'damascus-center' };

    beforeEach(() => {
      mockGetCarReferenceData.mockResolvedValue(mockReferenceData);
      mockGetVehicleMakes.mockResolvedValue(mockBrands);
      mockGetVehicleModels.mockResolvedValue(mockModels);
      mockApi.get.mockResolvedValue(mockLocation); // For location lookup
      
      // Complete mock response for listing creation
      const mockCreatedListingResponse = {
        id: 999,
        title: 'Test Car',
        description: 'Great car',
        modelYear: 2020,
        price: 25000,
        mileage: 50000,
        currency: 'USD',
        media: [],
        createdAt: '2023-01-01T00:00:00Z',
        approved: true,
        isExpired: false,
        sellerId: 100,
        sellerUsername: 'testuser',
        locationDetails: {
          id: 123,
          name: 'Damascus Center',
          slug: 'damascus-center',
          displayNameEn: 'Damascus Center',
          displayNameAr: 'مركز دمشق'
        },
        governorateDetails: {
          id: 1,
          name: 'Damascus',
          slug: 'damascus',
          displayNameEn: 'Damascus',
          displayNameAr: 'دمشق'
        },
        brand: {
          id: 1,
          name: 'toyota',
          slug: 'toyota',
          displayNameEn: 'Toyota',
          displayNameAr: 'تويوتا'
        },
        model: {
          id: 101,
          name: 'camry',
          slug: 'camry',
          displayNameEn: 'Camry',
          displayNameAr: 'كامري',
          brandId: 1
        },
        transmission: {
          id: 1,
          name: 'manual',
          slug: 'manual',
          displayNameEn: 'Manual',
          displayNameAr: 'يدوي'
        },
        fuelType: {
          id: 1,
          name: 'gasoline',
          slug: 'gasoline',
          displayNameEn: 'Gasoline',
          displayNameAr: 'بنزين'
        }
      };
      
      mockApi.post.mockResolvedValue(mockCreatedListingResponse); // For listing creation
    });

    it('should convert slugs to IDs correctly when creating a listing', async () => {
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',          // Slug
        model: 'camry',          // Slug  
        transmission: 'manual',   // Slug
        fuelType: 'gasoline',    // Slug
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        images: [],
        videos: [],
        videoUrls: []
      };

      await createListing(formData as any);

      // Verify location lookup
      expect(mockApi.get).toHaveBeenCalledWith('/api/locations/slug/damascus-center');

      // Verify brand lookup
      expect(mockGetVehicleMakes).toHaveBeenCalled();

      // Verify model lookup
      expect(mockGetVehicleModels).toHaveBeenCalledWith(1); // Toyota's ID

      // Verify reference data lookup
      expect(mockGetCarReferenceData).toHaveBeenCalled();

      // Verify the API call with converted IDs
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/listings',
        expect.objectContaining({
          title: 'Test Car',
          description: 'Great car',
          modelId: 101,         // Converted from 'camry' slug
          transmissionId: 1,    // Converted from 'manual' slug
          fuelTypeId: 1,        // Converted from 'gasoline' slug
          locationId: 123,      // Converted from 'damascus-center' slug
          modelYear: 2020,
          price: 25000,
          mileage: 50000,
          currency: 'USD'
        }),
        expect.any(Object) // Headers
      );
    });

    it('should handle missing transmission gracefully', async () => {
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        transmission: '', // Empty transmission
        fuelType: 'gasoline',
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        images: [],
        videos: [],
        videoUrls: []
      };

      await createListing(formData as any);

      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/listings',
        expect.objectContaining({
          modelId: 101,
          fuelTypeId: 1,
          // No transmissionId should be set
        }),
        expect.any(Object)
      );

      // Verify transmissionId is not in the call
      const callArgs = mockApi.post.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('transmissionId');
    });

    it('should handle invalid slugs gracefully', async () => {
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'invalid-brand',     // Invalid slug
        model: 'invalid-model',    // Invalid slug
        transmission: 'invalid-transmission', // Invalid slug
        fuelType: 'invalid-fuel',  // Invalid slug
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as any)).rejects.toThrow('Model ID is required and must be valid');
    });

    it('should validate required model ID', async () => {
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: '',  // No make
        model: '', // No model
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as any)).rejects.toThrow('Model ID is required and must be valid');
    });

    it('should validate required location', async () => {
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: '', // No location
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as any)).rejects.toThrow('Location is required');
    });

    it('should handle API errors during conversion', async () => {
      mockGetVehicleMakes.mockRejectedValue(new Error('API Error'));

      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as any)).rejects.toThrow('Failed to process selected brand');
    });
  });
});
