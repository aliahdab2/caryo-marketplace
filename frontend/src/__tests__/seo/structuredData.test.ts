import { generateVehicleSchema, generateOrganizationSchema, generateBreadcrumbSchema } from '@/utils/structuredData';
import { CarListing } from '@/services/api';

// Mock data for testing
const mockCarListing: CarListing = {
  id: 1,
  title: '2023 Toyota Camry SE',
  brandNameEn: 'Toyota',
  brandNameAr: 'تويوتا',
  modelNameEn: 'Camry',
  modelNameAr: 'كامري',
  governorateNameEn: 'Damascus',
  governorateNameAr: 'دمشق',
  locationDetails: {
    id: 1,
    displayNameEn: 'Damascus',
    displayNameAr: 'دمشق',
    slug: 'damascus',
    countryCode: 'SY',
    governorateId: 1,
    governorateNameEn: 'Damascus',
    governorateNameAr: 'دمشق',
    region: 'Middle East',
    latitude: 33.5138,
    longitude: 36.2765,
    active: true
  },
  governorateDetails: {
    id: 1,
    displayNameEn: 'Damascus',
    displayNameAr: 'دمشق',
    slug: 'damascus',
    countryId: 1,
    countryCode: 'SY',
    countryNameEn: 'Syria',
    countryNameAr: 'سوريا',
    region: 'Middle East',
    latitude: 33.5138,
    longitude: 36.2765
  },
  modelYear: 2023,
  price: 45000,
  mileage: 15000,
  transmission: { id: 1, name: 'automatic', slug: 'automatic', displayNameEn: 'Automatic', displayNameAr: 'أوتوماتيك' },
  fuelType: { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' },
  brand: { id: 1, name: 'toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
  model: { id: 1, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', isActive: true, brandId: 1 },
  transmissionNameEn: 'Automatic',
  transmissionNameAr: 'أوتوماتيك',
  fuelTypeNameEn: 'Gasoline',
  fuelTypeNameAr: 'بنزين',
  description: 'Excellent condition Toyota Camry with low mileage',
  media: [
    {
      id: 1,
      url: 'https://example.com/car1.jpg',
      fileKey: 'cars/car1.jpg',
      fileName: 'car1.jpg',
      contentType: 'image/jpeg',
      size: 1024000,
      sortOrder: 1,
      isPrimary: true,
      mediaType: 'image'
    }
  ],
  approved: true,
  sellerId: 123,
  sellerUsername: 'john_doe',
  createdAt: '2024-01-15T10:30:00Z',
  isSold: false,
  isArchived: false,
  isUserActive: true,
  isExpired: false
};

describe('Structured Data Generation', () => {
  describe('Vehicle Schema', () => {
    it('should generate valid vehicle schema with required fields', () => {
      const schema = generateVehicleSchema(mockCarListing, '/listings/1');
      
      // Check basic structure
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Vehicle');
      
      // Check required vehicle properties
      expect(schema.name).toBe(mockCarListing.title);
      expect(schema.brand).toEqual({
        '@type': 'Brand',
        name: mockCarListing.brandNameEn
      });
      expect(schema.model).toBe(mockCarListing.modelNameEn);
      expect(schema.vehicleModelDate).toBe(mockCarListing.modelYear);
      expect(schema.mileageFromOdometer).toEqual({
        '@type': 'QuantitativeValue',
        value: mockCarListing.mileage,
        unitCode: 'KMT'
      });
    });

    it('should include offer information', () => {
      const schema = generateVehicleSchema(mockCarListing, '/listings/1');
      
      expect(schema.offers).toEqual({
        '@type': 'Offer',
        price: mockCarListing.price,
        priceCurrency: 'SYP',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Person',
          name: mockCarListing.sellerUsername
        },
        url: 'https://caryo.sy/listings/1'
      });
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalListing: CarListing = {
        ...mockCarListing,
        description: '',
        media: [],
        mileage: 0
      };
      
      const schema = generateVehicleSchema(minimalListing, '/listings/1');
      
      expect(schema.description).toBe('Toyota Camry 2023');
      expect(schema.image).toBeUndefined();
      expect(schema.mileageFromOdometer).toBeUndefined();
    });

    it('should include media information when available', () => {
      const schema = generateVehicleSchema(mockCarListing, '/listings/1');
      
      expect(schema.image).toEqual([mockCarListing.media[0].url]);
    });

    it('should handle sold vehicles correctly', () => {
      const soldListing = {
        ...mockCarListing,
        isSold: true
      };
      
      const schema = generateVehicleSchema(soldListing, '/listings/1');
      
      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
    });

    it('should include fuel type and transmission when available', () => {
      const schema = generateVehicleSchema(mockCarListing, '/listings/1');

      expect(schema.fuelType).toBe('Gasoline');
      expect(schema.vehicleTransmission).toBe('Automatic');
    });

    it('should validate Schema.org Vehicle format', () => {
      const schema = generateVehicleSchema(mockCarListing, '/listings/1');
      
      // Required Schema.org Vehicle properties
      expect(schema).toHaveProperty('@context');
      expect(schema).toHaveProperty('@type');
      expect(schema).toHaveProperty('name');
      expect(schema).toHaveProperty('brand');
      expect(schema).toHaveProperty('model');
      expect(schema).toHaveProperty('offers');
      
      // Offers should have required properties
      expect(schema.offers).toHaveProperty('@type');
      expect(schema.offers).toHaveProperty('price');
      expect(schema.offers).toHaveProperty('priceCurrency');
      expect(schema.offers).toHaveProperty('availability');
    });
  });

  describe('Organization Schema', () => {
    it('should generate valid organization schema', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Caryo Marketplace');
      expect(schema.description).toContain('automotive marketplace');
      expect(schema.url).toBe('https://caryo.sy');
      expect(schema.logo).toBe('https://caryo.sy/logo.png');
    });

    it('should include contact point information', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema.contactPoint).toEqual({
        '@type': 'ContactPoint',
        contactType: 'customer service',
        areaServed: 'SY',
        availableLanguage: ['Arabic', 'English']
      });
    });

    it('should include address information', () => {
      const schema = generateOrganizationSchema();
      
      expect(schema.address).toEqual({
        '@type': 'PostalAddress',
        addressCountry: 'SY',
        addressRegion: 'Damascus'
      });
    });
  });

  describe('Breadcrumb Schema', () => {
    it('should generate valid breadcrumb schema', () => {
      const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Cars', href: '/cars' },
        { name: 'Toyota', href: '/cars/toyota' },
        { name: 'Camry', href: '/cars/toyota/camry' }
      ];
      
      const schema = generateBreadcrumbSchema(breadcrumbs);
      
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(4);
    });

    it('should create proper breadcrumb items', () => {
      const breadcrumbs = [
        { name: 'Home', href: '/' },
        { name: 'Cars', href: '/cars' }
      ];
      
      const schema = generateBreadcrumbSchema(breadcrumbs);
      
      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://caryo.sy/'
      });
      
      expect(schema.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Cars',
        item: 'https://caryo.sy/cars'
      });
    });

    it('should handle empty breadcrumbs', () => {
      expect(() => generateBreadcrumbSchema([])).toThrow('Breadcrumbs array cannot be empty');
    });
  });

  describe('Schema Validation', () => {
    it('should generate schemas that pass basic JSON-LD validation', () => {
      const vehicleSchema = generateVehicleSchema(mockCarListing, '/listings/1');
      const orgSchema = generateOrganizationSchema();
      const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', href: '/' }
      ]);
      
      // All schemas should be valid JSON
      expect(() => JSON.stringify(vehicleSchema)).not.toThrow();
      expect(() => JSON.stringify(orgSchema)).not.toThrow();
      expect(() => JSON.stringify(breadcrumbSchema)).not.toThrow();
      
      // All schemas should have required @context and @type
      [vehicleSchema, orgSchema, breadcrumbSchema].forEach(schema => {
        expect(schema['@context']).toBe('https://schema.org');
        expect(schema['@type']).toBeDefined();
      });
    });

    it('should handle edge cases without throwing errors', () => {
      // Test with minimal data
      const minimalListing: CarListing = {
        id: 1,
        title: 'Test Car',
        brandNameEn: 'Brand',
        brandNameAr: 'براند',
        modelNameEn: 'Model',
        modelNameAr: 'موديل',
        governorateNameEn: 'Gov',
        governorateNameAr: 'محافظة',
        locationDetails: {
          id: 1,
          displayNameEn: 'Location',
          displayNameAr: 'موقع',
          slug: 'location',
          countryCode: 'SY',
          governorateId: 1,
          governorateNameEn: 'Gov',
          governorateNameAr: 'محافظة',
          region: 'Region',
          latitude: 0,
          longitude: 0,
          active: true
        },
        governorateDetails: {
          id: 1,
          displayNameEn: 'Gov',
          displayNameAr: 'محافظة',
          slug: 'gov',
          countryId: 1,
          countryCode: 'SY',
          countryNameEn: 'Country',
          countryNameAr: 'بلد',
          region: 'Region',
          latitude: 0,
          longitude: 0
        },
        modelYear: 2020,
        price: 0,
        mileage: 0,
        transmission: { id: 0, name: '', slug: '', displayNameEn: '', displayNameAr: '' },
        fuelType: { id: 0, name: '', slug: '', displayNameEn: '', displayNameAr: '' },
        brand: { id: 1, name: 'brand', slug: 'brand', displayNameEn: 'Brand', displayNameAr: 'براند', isActive: true },
        model: { id: 1, name: 'model', slug: 'model', displayNameEn: 'Model', displayNameAr: 'موديل', isActive: true, brandId: 1 },
        transmissionNameEn: '',
        transmissionNameAr: '',
        fuelTypeNameEn: '',
        fuelTypeNameAr: '',
        description: '',
        media: [],
        approved: false,
        sellerId: 1,
        sellerUsername: 'user',
        createdAt: '2024-01-01T00:00:00Z',
        isSold: false,
        isArchived: false,
        isUserActive: true,
        isExpired: false
      };
      
      expect(() => generateVehicleSchema(minimalListing, '/test')).not.toThrow();
      
      const schema = generateVehicleSchema(minimalListing, '/test');
      expect(schema.offers.price).toBe(0);
      expect(schema.mileageFromOdometer).toBeUndefined();
    });
  });
});
