/**
 * Test suite for the new smart validation system
 * Testing all validation scenarios and edge cases
 */

import { validationSystem, validateStep, isStepAccessible, validateFormComplete } from '../validation';
import { ListingFormData } from '@/types/listings';

// Mock translation function
const mockT = (key: string, fallback: string) => fallback;

describe('Smart Validation System', () => {
  beforeEach(() => {
    // Clear any cached data between tests
    validationSystem.clearCache();
  });

  describe('Step 1 - Basic Information', () => {
    const basicFormData: Partial<ListingFormData> = {
      title: 'Test Car 2023',
      description: 'This is a test car description that meets minimum length requirements.',
      price: '25000',
      make: 'Toyota',
      model: 'Camry',
      year: '2023'
    };

    it('should pass validation with valid basic data', () => {
      const result = validationSystem.validateStep(1, basicFormData, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.validatedFields).toContain('title');
      expect(result.validatedFields).toContain('price');
    });

    it('should fail validation with missing required fields', () => {
      const incompleteData = { title: 'Test' };
      const result = validationSystem.validateStep(1, incompleteData, mockT);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('description');
      expect(result.errors).toHaveProperty('price');
      expect(result.errors).toHaveProperty('make');
    });

    it('should validate price correctly', () => {
      const invalidPriceData = { ...basicFormData, price: 'invalid' };
      const result = validationSystem.validateStep(1, invalidPriceData, mockT);
      
      expect(result.errors).toHaveProperty('price');
      expect(result.errors.price).toContain('number');
    });

    it('should validate year range correctly', () => {
      const invalidYearData = { ...basicFormData, year: '1800' };
      const result = validationSystem.validateStep(1, invalidYearData, mockT);
      
      expect(result.errors).toHaveProperty('year');
      expect(result.errors.year).toContain('1900');
    });

    it('should handle Arabic numerals in price', () => {
      const arabicPriceData = { ...basicFormData, price: '٢٥٠٠٠' };
      const result = validationSystem.validateStep(1, arabicPriceData, mockT);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('Step 2 - Vehicle Details (Optional)', () => {
    const vehicleDetailsData: Partial<ListingFormData> = {
      mileage: '50000',
      condition: 'used',
      fuelType: 'gasoline',
      transmission: 'automatic'
    };

    it('should pass validation with valid optional data', () => {
      const result = validationSystem.validateStep(2, vehicleDetailsData, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should pass validation with empty optional data', () => {
      const result = validationSystem.validateStep(2, {}, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should validate mileage when provided', () => {
      const invalidMileageData = { mileage: 'invalid_mileage' };
      const result = validationSystem.validateStep(2, invalidMileageData, mockT);
      
      expect(result.errors).toHaveProperty('mileage');
    });
  });

  describe('Step 3 - Contact Information', () => {
    const contactData: Partial<ListingFormData> = {
      contactName: 'John Doe',
      contactPhone: '+963123456789',
      contactEmail: 'john@example.com',
      governorateSlug: 'damascus',
      locationSlug: 'damascus-city'
    };

    it('should pass validation with valid contact data', () => {
      const result = validationSystem.validateStep(3, contactData, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should fail validation with missing required contact fields', () => {
      const incompleteData = { contactName: 'John' };
      const result = validationSystem.validateStep(3, incompleteData, mockT);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('contactPhone');
      expect(result.errors).toHaveProperty('governorateSlug');
    });

    it('should validate phone number format', () => {
      const invalidPhoneData = { ...contactData, contactPhone: '123' };
      const result = validationSystem.validateStep(3, invalidPhoneData, mockT);
      
      expect(result.errors).toHaveProperty('contactPhone');
    });

    it('should validate email format when provided', () => {
      const invalidEmailData = { ...contactData, contactEmail: 'invalid-email' };
      const result = validationSystem.validateStep(3, invalidEmailData, mockT);
      
      expect(result.errors).toHaveProperty('contactEmail');
    });
  });

  describe('Multi-step Validation', () => {
    const completeFormData: Partial<ListingFormData> = {
      title: 'Test Car 2023',
      description: 'Complete test car description with all required information.',
      price: '25000',
      make: 'Toyota',
      model: 'Camry',
      year: '2023',
      mileage: '50000',
      condition: 'used',
      contactName: 'John Doe',
      contactPhone: '+963123456789',
      governorateSlug: 'damascus',
      locationSlug: 'damascus-city'
    };

    it('should validate multiple steps at once', () => {
      const result = validationSystem.validateSteps([1, 2, 3], completeFormData, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.validatedFields.length).toBeGreaterThan(5);
    });

    it('should validate complete form', () => {
      const result = validateFormComplete(completeFormData, mockT);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should check step accessibility correctly', () => {
      const basicData = {
        title: 'Test',
        description: 'Test description',
        price: '25000',
        make: 'Toyota',
        model: 'Camry',
        year: '2023'
      };

      expect(isStepAccessible(1, basicData, mockT)).toBe(true);
      expect(isStepAccessible(2, basicData, mockT)).toBe(true);
      expect(isStepAccessible(3, basicData, mockT)).toBe(true);
    });

    it('should prevent access to steps when dependencies fail', () => {
      const incompleteData = { title: 'Test' }; // Missing required fields
      
      expect(isStepAccessible(2, incompleteData, mockT)).toBe(false);
      expect(isStepAccessible(3, incompleteData, mockT)).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with the old validateStep function signature', () => {
      const basicData = {
        title: 'Test Car',
        description: 'Test description',
        price: '25000',
        make: 'Toyota',
        model: 'Camry',
        year: '2023'
      };

      // Test single step
      const singleResult = validateStep(1, basicData, mockT);
      expect(Object.keys(singleResult)).toHaveLength(0);

      // Test multiple steps
      const multiResult = validateStep([1, 2], basicData, mockT);
      expect(Object.keys(multiResult)).toHaveLength(0);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle empty form data gracefully', () => {
      const result = validationSystem.validateStep(1, {}, mockT);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.validatedFields).toBeDefined();
    });

    it('should handle invalid step numbers', () => {
      const result = validationSystem.validateStep(999, {}, mockT);
      
      expect(result.isValid).toBe(true); // No config found, returns valid
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should handle null/undefined values', () => {
      const dataWithNulls = {
        title: null,
        description: undefined,
        price: '',
        make: 'Toyota',
        model: 'Camry',
        year: '2023'
      };

      const result = validationSystem.validateStep(1, dataWithNulls, mockT);
      
      expect(result.errors).toHaveProperty('title');
      expect(result.errors).toHaveProperty('description');
      expect(result.errors).toHaveProperty('price');
    });
  });
});
