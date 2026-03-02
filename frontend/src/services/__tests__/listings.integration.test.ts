import { createListing } from '../listings';
import { api } from '../api';
import { getCarReferenceData, getVehicleMakes, getVehicleModels } from '../referenceData';
import type { ListingFormData } from '@/types/listings';

// Mock dependencies
jest.mock('../api');
jest.mock('../referenceData');
jest.mock('@/utils/auth', () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ 'Authorization': 'Bearer test-token' })
}));

jest.mock('next-auth/react', () => ({
  getSession: jest.fn().mockResolvedValue({
    accessToken: 'test-token'
  })
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
      
      // Mock fetch instead of api.post since createListing uses fetch directly
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCreatedListingResponse,
        text: async () => JSON.stringify(mockCreatedListingResponse)
      } as Response);
    });

    it('should convert slugs to IDs correctly when creating a listing', async () => {
      // V2: Form data includes IDs directly (no lookups needed)
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',            // For display
        model: 'camry',           // For display
        makeId: 1,                // Direct ID
        modelId: 1,               // Direct ID
        transmission: 'manual',   // For display
        fuelType: 'gasoline',    // For display  
        transmissionId: 1,        // Direct ID
        fuelTypeId: 1,           // Direct ID
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center', // For display
        locationId: 123,          // Direct ID
        images: [],
        videos: [],
        videoUrls: []
      };

      await createListing(formData as unknown as ListingFormData);

      // V2: No lookups are performed since IDs are provided directly
      // Verify NO location lookup is called
      expect(mockApi.get).not.toHaveBeenCalledWith('/api/locations/slug/damascus-center');

      // Verify NO brand/model lookups are called 
      expect(mockGetVehicleMakes).not.toHaveBeenCalled();
      expect(mockGetVehicleModels).not.toHaveBeenCalled();

      // Verify NO reference data lookup is called
      expect(mockGetCarReferenceData).not.toHaveBeenCalled();

      // Verify the fetch call was made (createListing uses fetch directly)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: expect.stringContaining('"modelId":1') // V2: Uses ID directly from form data
        })
      );
    });

    it('should handle missing transmission gracefully', async () => {
      // V2: Form data includes IDs directly, missing transmission means no transmissionId
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        makeId: 1,
        modelId: 1,
        transmission: '', // Empty transmission
        fuelType: 'gasoline',
        fuelTypeId: 1,
        // transmissionId: undefined, // No transmission ID provided
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        locationId: 123,
        images: [],
        videos: [],
        videoUrls: []
      };

      await createListing(formData as unknown as ListingFormData);

      // Verify the fetch call was made (createListing uses fetch directly)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/listings'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"modelId":1')
        })
      );

      // Verify transmissionId is not in the request body
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = fetchCall[1]!.body;
      expect(requestBody).not.toContain('transmissionId');
    });

    it('should handle missing model ID gracefully', async () => {
      // V2: Test missing modelId (since we no longer validate slugs)
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        makeId: 1,
        modelId: 0, // Invalid model ID
        transmission: 'manual',
        fuelType: 'gasoline',
        transmissionId: 1,
        fuelTypeId: 1,
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        locationId: 123,
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as unknown as ListingFormData)).rejects.toThrow('Model ID is required and must be valid');
    });

    it('should validate required model ID', async () => {
      // V2: Test with modelId set to 0 (invalid)
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: '',  // No make
        model: '', // No model
        makeId: 0, // Invalid ID
        modelId: 0, // Invalid ID
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        locationId: 123,
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as unknown as ListingFormData)).rejects.toThrow('Model ID is required and must be valid');
    });

    it('should validate required location', async () => {
      // V2: Test missing locationId
      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        makeId: 1,
        modelId: 1,
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: '', // No location
        locationId: 0, // Invalid location ID
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as unknown as ListingFormData)).rejects.toThrow('Location ID is required');
    });

    it('should handle API errors during listing creation', async () => {
      // V2: Test API errors during fetch call (since no conversion lookups happen)
      mockFetch.mockRejectedValue(new Error('Network Error'));

      const formData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        makeId: 1,
        modelId: 1,
        transmissionId: 1,
        fuelTypeId: 1,
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        locationSlug: 'damascus-center',
        locationId: 123,
        images: [],
        videos: [],
        videoUrls: []
      };

      await expect(createListing(formData as unknown as ListingFormData)).rejects.toThrow('Failed to create listing');
    });
  });
});
