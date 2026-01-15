/**
 * Tests for validateStepWithZod function
 * 
 * This tests the new Zod-based validation that can be used
 * as a replacement for the existing validateStep function.
 */

import { validateStepWithZod } from '../formUtils';
import { ListingFormData } from '@/types/listings';

// Mock translation function
const mockT = (key: string, fallback: string) => fallback || key;

// Helper to create minimal valid form data
const createFormData = (overrides: Partial<ListingFormData> = {}): ListingFormData => ({
  id: '',
  title: '',
  description: '',
  make: '',
  model: '',
  year: '',
  price: '',
  currency: 'USD',
  condition: 'used',
  mileage: '',
  engine: '',
  color: '',
  exteriorColor: '',
  interiorColor: '',
  transmission: '',
  fuelType: '',
  features: [],
  categoryId: '',
  location: '',
  governorateSlug: '',
  locationSlug: '',
  state: '',
  zipCode: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  contactPreference: 'phone',
  images: [],
  videos: [],
  videoUrls: [],
  existingImageUrls: [],
  existingVideoUrls: [],
  existingMediaItems: [],
  mediaToDelete: [],
  status: 'active',
  ...overrides,
});

describe('validateStepWithZod', () => {
  describe('Step 1: Vehicle Identity', () => {
    it('should return errors for empty Step 1 fields', () => {
      const formData = createFormData();
      const errors = validateStepWithZod(1, formData, mockT);
      
      expect(errors.make).toBeDefined();
      expect(errors.model).toBeDefined();
      expect(errors.year).toBeDefined();
    });

    it('should return no errors for valid Step 1 data', () => {
      const formData = createFormData({
        make: 'toyota',
        model: 'camry',
        year: '2022',
      });
      const errors = validateStepWithZod(1, formData, mockT);
      
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should return error for invalid year', () => {
      const formData = createFormData({
        make: 'toyota',
        model: 'camry',
        year: '1800', // Invalid year
      });
      const errors = validateStepWithZod(1, formData, mockT);
      
      expect(errors.year).toBeDefined();
    });
  });

  describe('Step 2: Vehicle Details', () => {
    it('should return errors for empty Step 2 fields', () => {
      const formData = createFormData({ condition: '' }); // Override default
      const errors = validateStepWithZod(2, formData, mockT);
      
      expect(errors.transmission).toBeDefined();
      expect(errors.fuelType).toBeDefined();
      expect(errors.mileage).toBeDefined();
      expect(errors.condition).toBeDefined();
    });

    it('should return no errors for valid Step 2 data', () => {
      const formData = createFormData({
        transmission: 'automatic',
        fuelType: 'gasoline',
        mileage: '50000',
        condition: 'used',
      });
      const errors = validateStepWithZod(2, formData, mockT);
      
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should accept mileage with commas', () => {
      const formData = createFormData({
        transmission: 'automatic',
        fuelType: 'gasoline',
        mileage: '50,000',
        condition: 'used',
      });
      const errors = validateStepWithZod(2, formData, mockT);
      
      expect(errors.mileage).toBeUndefined();
    });
  });

  describe('Step 3: Content & Media', () => {
    it('should return errors for empty Step 3 fields', () => {
      const formData = createFormData();
      const errors = validateStepWithZod(3, formData, mockT);
      
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
    });

    it('should return no errors for valid Step 3 data with images', () => {
      const formData = createFormData({
        title: 'Beautiful Toyota Camry 2022 for Sale',
        description: 'This is a well-maintained Toyota Camry with low mileage and excellent condition.',
        images: [new File([''], 'test.jpg')],
      });
      const errors = validateStepWithZod(3, formData, mockT);
      
      expect(errors.title).toBeUndefined();
      expect(errors.description).toBeUndefined();
    });

    it('should return error for title too short', () => {
      const formData = createFormData({
        title: 'Short',
        description: 'This is a valid description with enough characters.',
        images: [new File([''], 'test.jpg')],
      });
      const errors = validateStepWithZod(3, formData, mockT);
      
      expect(errors.title).toBeDefined();
    });
  });

  describe('Step 4: Pricing & Contact', () => {
    it('should return errors for empty Step 4 fields', () => {
      const formData = createFormData();
      const errors = validateStepWithZod(4, formData, mockT);
      
      expect(errors.price).toBeDefined();
      expect(errors.governorateSlug).toBeDefined();
      expect(errors.locationSlug).toBeDefined();
      expect(errors.contactName).toBeDefined();
      expect(errors.contactPhone).toBeDefined();
    });

    it('should return no errors for valid Step 4 data', () => {
      const formData = createFormData({
        price: '25000',
        currency: 'USD',
        governorateSlug: 'damascus',
        locationSlug: 'central-damascus',
        contactName: 'John Doe',
        contactPhone: '+963 123 456 789',
      });
      const errors = validateStepWithZod(4, formData, mockT);
      
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should return error for invalid price', () => {
      const formData = createFormData({
        price: 'not-a-number',
        currency: 'USD',
        governorateSlug: 'damascus',
        locationSlug: 'central-damascus',
        contactName: 'John Doe',
        contactPhone: '+963 123 456 789',
      });
      const errors = validateStepWithZod(4, formData, mockT);
      
      expect(errors.price).toBeDefined();
    });

    it('should accept optional email', () => {
      const formData = createFormData({
        price: '25000',
        currency: 'USD',
        governorateSlug: 'damascus',
        locationSlug: 'central-damascus',
        contactName: 'John Doe',
        contactPhone: '+963 123 456 789',
        contactEmail: 'john@example.com',
      });
      const errors = validateStepWithZod(4, formData, mockT);
      
      expect(errors.contactEmail).toBeUndefined();
    });

    it('should return error for invalid email format', () => {
      const formData = createFormData({
        price: '25000',
        currency: 'USD',
        governorateSlug: 'damascus',
        locationSlug: 'central-damascus',
        contactName: 'John Doe',
        contactPhone: '+963 123 456 789',
        contactEmail: 'not-an-email',
      });
      const errors = validateStepWithZod(4, formData, mockT);
      
      expect(errors.contactEmail).toBeDefined();
    });
  });

  describe('Unknown Step', () => {
    it('should return empty errors for unknown step', () => {
      const formData = createFormData();
      const errors = validateStepWithZod(99, formData, mockT);
      
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
