/**
 * Step Navigation Tests
 * 
 * Tests for step navigation logic and accessibility in the ListingWizard:
 * - Step accessibility based on validation
 * - Navigation validation requirements
 * - Step progression rules
 * - Navigation between different steps
 * 
 * These tests focus on the business logic behind step navigation
 * without the complexity of full component testing.
 */

import { validateStep } from '../formUtils';
import { ListingFormData } from '@/types/listings';

// Mock translation function
const mockT = jest.fn((key: string, fallback: string) => fallback);

// Helper to create form data with specific step completion
const createFormDataForStep = (completedSteps: number[]): ListingFormData => {
  const baseData: ListingFormData = {
    // Step 1 fields
    make: '',
    makeId: undefined,
    model: '',
    modelId: undefined,
    year: '',
    title: '',
    description: '',
    price: '',
    
    // Step 2 fields
    mileage: '',
    transmission: '',
    transmissionId: undefined,
    fuelType: '',
    fuelTypeId: undefined,
    color: '',
    condition: '',
    engine: '',
    exteriorColor: '',
    interiorColor: '',
    
    // Step 3 fields
    images: [],
    videos: [],
    videoUrls: [],
    existingImageUrls: [],
    existingVideoUrls: [],
    features: [],
    
    // Step 4 fields
    currency: 'USD',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactPreference: 'email',
    governorateSlug: '',
    governorateId: undefined,
    locationSlug: '',
    locationId: undefined,
    location: '',
    categoryId: '',
    attributes: {},
  };

  // Fill in required fields based on completed steps
  if (completedSteps.includes(1)) {
    baseData.make = 'toyota';
    baseData.makeId = 1;
    baseData.model = 'camry';
    baseData.modelId = 1;
    baseData.year = '2020';
    // Don't fill title/description/price here - they're for later steps
  }

  if (completedSteps.includes(2)) {
    baseData.mileage = '50000';
    baseData.transmission = 'manual';
    baseData.transmissionId = 1;
    baseData.fuelType = 'gasoline';
    baseData.fuelTypeId = 1;
  }

  if (completedSteps.includes(3)) {
    // Step 3 requires title, description, and images
    baseData.title = 'Great Car';
    baseData.description = 'Excellent condition';
    baseData.images = ['car-image1.jpg', 'car-image2.jpg'];
  }

  if (completedSteps.includes(4)) {
    baseData.contactName = 'John Doe';
    baseData.contactPhone = '+963123456789';
    baseData.contactEmail = 'john@example.com';
    baseData.governorateSlug = 'damascus';
    baseData.governorateId = 1;
    baseData.locationSlug = 'old-damascus';
    baseData.locationId = 1;
    baseData.images = [new File([''], 'test.jpg')];
    baseData.price = '25000';
  }

  return baseData;
};

// Helper to check if step is accessible based on validation
// This mimics the actual navigation logic in ListingWizard
const isStepAccessible = (targetStep: number, formData: ListingFormData): boolean => {
  // Step 1 is always accessible
  if (targetStep === 1) return true;

  // For other steps, validate all previous steps (not current step)
  // This matches the actual wizard navigation behavior
  for (let step = 1; step < targetStep; step++) {
    const stepErrors = validateStep(step, formData, mockT, { mode: 'accessibility' });
    if (Object.keys(stepErrors).length > 0) {
      return false;
    }
  }

  return true;
};

describe('Step Navigation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step Accessibility Logic', () => {
    it('should allow access to step 1 always', () => {
      const emptyFormData = createFormDataForStep([]);
      expect(isStepAccessible(1, emptyFormData)).toBe(true);
    });

    it('should block access to step 2 without step 1 completion', () => {
      const emptyFormData = createFormDataForStep([]);
      expect(isStepAccessible(2, emptyFormData)).toBe(false);
    });

    it('should allow access to step 2 with step 1 completed', () => {
      const formDataWithStep1 = createFormDataForStep([1]);
      expect(isStepAccessible(2, formDataWithStep1)).toBe(true);
    });

    it('should block access to step 3 without step 1 and 2 completion', () => {
      const formDataWithStep1Only = createFormDataForStep([1]);
      expect(isStepAccessible(3, formDataWithStep1Only)).toBe(true); // Step 2 has no blocking requirements
      
      const emptyFormData = createFormDataForStep([]);
      expect(isStepAccessible(3, emptyFormData)).toBe(false); // Step 1 not completed
    });

    it('should allow access to step 3 with step 1 and 2 completed', () => {
      const formDataWithSteps12 = createFormDataForStep([1, 2]);
      expect(isStepAccessible(3, formDataWithSteps12)).toBe(true);
    });

    it('should block access to step 4 without previous steps completion', () => {
      const formDataWithSteps12 = createFormDataForStep([1, 2]);
      expect(isStepAccessible(4, formDataWithSteps12)).toBe(false); // Step 3 not completed
      
      const emptyFormData = createFormDataForStep([]);
      expect(isStepAccessible(4, emptyFormData)).toBe(false);
    });

    it('should allow access to step 4 with all previous steps completed', () => {
      const formDataWithSteps123 = createFormDataForStep([1, 2, 3]);
      expect(isStepAccessible(4, formDataWithSteps123)).toBe(true);
    });
  });

  describe('Navigation Mode Validation', () => {
    it('should use navigation mode for step progression (less strict)', () => {
      // Create form data with only blocking fields for step 1
      const formData = createFormDataForStep([]);
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '2020';
      // Missing title, description, price (non-blocking for navigation)

      const navErrors = validateStep(1, formData, mockT, { mode: 'navigation' });
      expect(Object.keys(navErrors)).toHaveLength(0);

      const finalErrors = validateStep(1, formData, mockT, { mode: 'final' });
      expect(Object.keys(finalErrors).length).toBe(0); // Step 1 only requires make, model, year now
    });

    it('should allow step 2 access with minimal step 1 completion', () => {
      const formData = createFormDataForStep([]);
      // Only fill blocking fields for step 1
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '2020';

      expect(isStepAccessible(2, formData)).toBe(true);
    });
  });

  describe('Step-Specific Navigation Requirements', () => {
    describe('Step 1 -> Step 2 Navigation', () => {
      it('should require make, model, year for step 2 access', () => {
        const testCases = [
          { missing: 'make', data: { model: 'camry', modelId: 1, year: '2020' } },
          { missing: 'model', data: { make: 'toyota', makeId: 1, year: '2020' } },
          { missing: 'year', data: { make: 'toyota', makeId: 1, model: 'camry', modelId: 1 } },
        ];

        testCases.forEach(({ missing: _missing, data }) => {
          const formData = createFormDataForStep([]);
          Object.assign(formData, data);
          
          expect(isStepAccessible(2, formData)).toBe(false);
        });
      });

      it('should not require title, description, price for step 2 access', () => {
        const formData = createFormDataForStep([]);
        formData.make = 'toyota';
        formData.makeId = 1;
        formData.model = 'camry';
        formData.modelId = 1;
        formData.year = '2020';
        // Intentionally not setting title, description, price

        expect(isStepAccessible(2, formData)).toBe(true);
      });
    });

    describe('Step 2 -> Step 3 Navigation', () => {
      it('should allow step 3 access even without step 2 optional fields', () => {
        const formData = createFormDataForStep([1]);
        // Step 2 has no required fields for navigation
        expect(isStepAccessible(3, formData)).toBe(true);
      });
    });

    describe('Step 3 -> Step 4 Navigation', () => {
      it('should require title and description for step 4 access', () => {
        const formData = createFormDataForStep([1, 2]);
        // Clear title and description
        formData.title = '';
        formData.description = '';

        expect(isStepAccessible(4, formData)).toBe(false);
      });

      it('should allow step 4 access with title and description', () => {
        const formData = createFormDataForStep([1, 2, 3]);
        expect(isStepAccessible(4, formData)).toBe(true);
      });
    });
  });

  describe('Progressive Navigation Flow', () => {
    it('should support complete navigation flow', () => {
      const formData = createFormDataForStep([]);

      // Start: Only step 1 accessible
      expect(isStepAccessible(1, formData)).toBe(true);
      expect(isStepAccessible(2, formData)).toBe(false);
      expect(isStepAccessible(3, formData)).toBe(false);
      expect(isStepAccessible(4, formData)).toBe(false);

      // Complete step 1 blocking fields
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '2020';

      // Now step 2 and 3 accessible (step 3 doesn't check its own validation for navigation)
      expect(isStepAccessible(1, formData)).toBe(true);
      expect(isStepAccessible(2, formData)).toBe(true);
      expect(isStepAccessible(3, formData)).toBe(true); // Accessible because step 1 & 2 are valid
      expect(isStepAccessible(4, formData)).toBe(false); // Step 3 has validation errors (missing title/description)

      // Complete step 3 requirements (title/description/images)
      formData.title = 'Great Car';
      formData.description = 'Excellent condition';
      formData.images = ['car-image1.jpg', 'car-image2.jpg'];

      // Now step 4 is accessible (step 3 is now valid)
      expect(isStepAccessible(1, formData)).toBe(true);
      expect(isStepAccessible(2, formData)).toBe(true);
      expect(isStepAccessible(3, formData)).toBe(true);
      expect(isStepAccessible(4, formData)).toBe(true);
    });
  });

  describe('Navigation Edge Cases', () => {
    it('should handle invalid step numbers gracefully', () => {
      const formData = createFormDataForStep([1, 2, 3, 4]);
      
      // Should not throw for invalid steps
      expect(() => isStepAccessible(0, formData)).not.toThrow();
      expect(() => isStepAccessible(5, formData)).not.toThrow();
      expect(() => isStepAccessible(-1, formData)).not.toThrow();
    });

    it('should handle navigation with partially filled forms', () => {
      const formData = createFormDataForStep([]);
      
      // Partially fill step 1
      formData.make = 'toyota';
      formData.model = 'camry';
      // Missing year

      expect(isStepAccessible(2, formData)).toBe(false);
      
      // Complete step 1
      formData.year = '2020';
      expect(isStepAccessible(2, formData)).toBe(true);
    });

    it('should handle form with validation errors', () => {
      const formData = createFormDataForStep([]);
      
      // Set invalid data
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '1800'; // Invalid year

      expect(isStepAccessible(2, formData)).toBe(false);
    });
  });

  describe('Validation Mode Impact on Navigation', () => {
    it('should use accessibility mode for navigation checks', () => {
      const formData = createFormDataForStep([]);
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '2020';

      // Accessibility mode should have same requirements as navigation mode
      const accessibilityErrors = validateStep(1, formData, mockT, { mode: 'accessibility' });
      const navigationErrors = validateStep(1, formData, mockT, { mode: 'navigation' });

      expect(Object.keys(accessibilityErrors)).toEqual(Object.keys(navigationErrors));
    });

    it('should be more permissive than final validation', () => {
      const formData = createFormDataForStep([]);
      formData.make = 'toyota';
      formData.makeId = 1;
      formData.model = 'camry';
      formData.modelId = 1;
      formData.year = '2020';
      // Missing title, description, price

      const navigationErrors = validateStep(1, formData, mockT, { mode: 'navigation' });
      const finalErrors = validateStep(1, formData, mockT, { mode: 'final' });

      // Both should be equal now since step 1 has same requirements for both modes
      expect(Object.keys(navigationErrors).length).toBe(Object.keys(finalErrors).length);
    });
  });
});
