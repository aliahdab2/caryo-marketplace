import { ListingDataService } from '../ListingDataService';
import { getMyListingById } from '../listings';

// Mock the listings service
jest.mock('../listings', () => ({
  getMyListingById: jest.fn(),
}));

const mockGetMyListingById = getMyListingById as jest.MockedFunction<typeof getMyListingById>;

describe('ListingDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFormData', () => {
    it('should return default form data for create mode', async () => {
      const result = await ListingDataService.loadFormData('create');

      expect(result).toEqual({
        title: "",
        description: "",
        make: "",
        model: "",
        year: "",
        price: "",
        currency: "USD",
        mileage: "",
        engine: "",
        color: "",
        transmission: "",
        fuelType: "",
        exteriorColor: "",
        interiorColor: "",
        governorateSlug: "",
        locationSlug: "",
        state: "",
        zipCode: "",
        contactPhone: "",
        contactName: "",
        contactEmail: "",
        contactPreference: "phone",
        condition: "used",
        features: [],
        status: "active",
        images: [],
        videos: [],
        videoUrls: [],
        categoryId: "1",
        existingImageUrls: [],
        existingVideoUrls: []
      });
    });

    it('should load and transform data for edit mode', async () => {
      const mockListing = {
        id: '123',
        title: 'Test Car',
        description: 'Great car',
        // V2 Enhanced object fields
        brand: {
          id: 1,
          name: 'toyota',
          slug: 'toyota',
          displayNameEn: 'Toyota',
          displayNameAr: 'تويوتا'
        },
        model: {
          id: 1,
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
        },
        // Deprecated fields (for backward compatibility testing)
        brandNameEn: 'Toyota',
        brandNameAr: 'تويوتا',
        modelNameEn: 'Camry',
        modelNameAr: 'كامري',
        year: 2020,
        modelYear: 2020,
        price: 25000,
        currency: 'USD',
        mileage: 50000,
        features: ['ABS', 'Airbags'],
        media: [
          { url: 'image1.jpg', type: 'image/jpeg', isPrimary: true },
          { url: 'video1.mp4', type: 'video/mp4', isPrimary: false },
          { url: 'https://youtube.com/watch?v=xyz', type: undefined, isPrimary: false }
        ],
        location: {
          city: 'Damascus',
          address: 'Test Address'
        },
        governorate: {
          nameEn: 'Damascus',
          nameAr: 'دمشق'
        },
        createdAt: '2023-01-01T00:00:00Z',
        seller: {
          name: 'John Doe',
          phone: '+963123456789',
          email: 'john@example.com'
        },
        // V3: Direct contact fields on listing (recent enhancement)
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '+963123456789',
        contactPreference: 'email'
      };

      mockGetMyListingById.mockResolvedValue(mockListing );

      const result = await ListingDataService.loadFormData('edit', '123');

      expect(mockGetMyListingById).toHaveBeenCalledWith('123');
      expect(result).toMatchObject({
        id: '123',
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota', // Should use slug from V2 object
        model: 'camry', // Should use slug from V2 object
        year: '2020',
        price: '25000',
        currency: 'USD',
        mileage: '50000',
        transmission: 'manual', // Should use slug from V2 object
        fuelType: 'gasoline', // Should use slug from V2 object
        features: ['ABS', 'Airbags'],
        condition: 'used',
        location: 'Damascus',
        state: 'Damascus',
        contactName: 'John Doe',
        contactPhone: '+963123456789',
        contactEmail: 'john@example.com',
        existingImageUrls: ['image1.jpg'],
        existingVideoUrls: ['https://youtube.com/watch?v=xyz'],
        videoUrls: [
          { url: 'video1.mp4', isValidated: false },
          { url: 'https://youtube.com/watch?v=xyz', isValidated: true }
        ]
      });
    });

    it('should handle missing listing for edit mode', async () => {
      mockGetMyListingById.mockRejectedValue(new Error('Listing not found'));

      await expect(
        ListingDataService.loadFormData('edit', '999')
      ).rejects.toThrow('Failed to load listing data for editing');
    });

    it('should handle missing media gracefully', async () => {
      const mockListing = {
        id: '123',
        title: 'Test Car',
        description: 'Great car',
        // V2 Enhanced object fields
        brand: {
          id: 1,
          name: 'toyota',
          slug: 'toyota',
          displayNameEn: 'Toyota',
          displayNameAr: 'تويوتا'
        },
        model: {
          id: 1,
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
        },
        // Deprecated fields (for backward compatibility)
        brandNameEn: 'Toyota',
        modelNameEn: 'Camry',
        year: 2020,
        price: 25000,
        mileage: 50000,
        media: [], // Empty media array
        location: { city: 'Damascus' },
        governorate: { nameEn: 'Damascus' },
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockGetMyListingById.mockResolvedValue(mockListing );

      const result = await ListingDataService.loadFormData('edit', '123');

      expect(result.existingImageUrls).toEqual([]);
      expect(result.existingVideoUrls).toEqual([]);
      expect(result.videoUrls).toEqual([]);
    });

    it('should use fallback values for missing data', async () => {
      const mockListing = {
        id: '123',
        // Missing most fields to test fallbacks
        createdAt: '2023-01-01T00:00:00Z'
      };

      mockGetMyListingById.mockResolvedValue(mockListing );

      const result = await ListingDataService.loadFormData('edit', '123');

      expect(result.title).toBe('');
      expect(result.description).toBe('');
      expect(result.make).toBe('');
      expect(result.model).toBe('');
      expect(result.currency).toBe('USD');
      expect(result.transmission).toBe('');
      expect(result.fuelType).toBe('');
    });
  });

  describe('validateFormData', () => {
    it('should return no errors for valid create data', () => {
      const validData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        year: '2020',
        price: '25000',
        governorateSlug: 'damascus',
        locationSlug: 'damascus-center',
        images: ['image1.jpg'],
        existingImageUrls: []
      };

      const errors = ListingDataService.validateFormData(validData, 'create');
      expect(errors).toEqual([]);
    });

    it('should return errors for missing required fields', () => {
      const invalidData = {};

      const errors = ListingDataService.validateFormData(invalidData, 'create');

      expect(errors).toContain('Title is required');
      expect(errors).toContain('Description is required');
      expect(errors).toContain('Make is required');
      expect(errors).toContain('Model is required');
      expect(errors).toContain('Year is required');
      expect(errors).toContain('Price is required');
      expect(errors).toContain('Governorate is required');
      expect(errors).toContain('Location is required');
      expect(errors).toContain('At least one image is required');
    });

    it('should allow existing images for edit mode', () => {
      const editData = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        year: '2020',
        price: '25000',
        governorateSlug: 'damascus',
        locationSlug: 'damascus-center',
        images: [], // No new images
        existingImageUrls: ['existing-image.jpg'] // But has existing
      };

      const errors = ListingDataService.validateFormData(editData, 'edit');
      expect(errors).toEqual([]);
    });

    it('should validate image requirement correctly', () => {
      const dataWithNewImages = {
        title: 'Test Car',
        description: 'Great car',
        make: 'toyota',
        model: 'camry',
        year: '2020',
        price: '25000',
        governorateSlug: 'damascus',
        locationSlug: 'damascus-center',
        images: ['new-image.jpg'],
        existingImageUrls: []
      };

      const errors = ListingDataService.validateFormData(dataWithNewImages, 'create');
      expect(errors).not.toContain('At least one image is required');
    });
  });
});
