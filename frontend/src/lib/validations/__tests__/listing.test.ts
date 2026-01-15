import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  listingSchema,
  validateListingStep,
  validateListing,
  getValidationErrors,
  ListingValidationMessages,
} from '../listing';

describe('Listing Validation Schemas', () => {
  describe('Step 1: Vehicle Identity', () => {
    const validStep1 = {
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
    };

    it('should pass for valid vehicle identity', () => {
      expect(step1Schema.safeParse(validStep1).success).toBe(true);
    });

    it('should fail for missing make', () => {
      const result = step1Schema.safeParse({ ...validStep1, make: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ListingValidationMessages.makeRequired);
      }
    });

    it('should fail for missing model', () => {
      const result = step1Schema.safeParse({ ...validStep1, model: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(ListingValidationMessages.modelRequired);
      }
    });

    it('should fail for invalid year', () => {
      const result = step1Schema.safeParse({ ...validStep1, year: '1800' });
      expect(result.success).toBe(false);
    });

    it('should accept current year + 1 for upcoming models', () => {
      const nextYear = (new Date().getFullYear() + 1).toString();
      const result = step1Schema.safeParse({ ...validStep1, year: nextYear });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 2: Vehicle Details', () => {
    const validStep2 = {
      transmission: 'automatic',
      fuelType: 'gasoline',
      mileage: '50000',
      condition: 'used',
    };

    it('should pass for valid vehicle details', () => {
      expect(step2Schema.safeParse(validStep2).success).toBe(true);
    });

    it('should pass with optional fields', () => {
      const result = step2Schema.safeParse({
        ...validStep2,
        engine: '2.5L V6',
        exteriorColor: 'Silver',
        interiorColor: 'Black',
        features: ['Leather seats', 'Sunroof'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for missing transmission', () => {
      const result = step2Schema.safeParse({ ...validStep2, transmission: '' });
      expect(result.success).toBe(false);
    });

    it('should fail for invalid mileage', () => {
      const result = step2Schema.safeParse({ ...validStep2, mileage: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should accept mileage with commas', () => {
      const result = step2Schema.safeParse({ ...validStep2, mileage: '50,000' });
      expect(result.success).toBe(true);
    });
  });

  describe('Step 3: Content & Media', () => {
    const validStep3 = {
      title: 'Beautiful Toyota Camry 2022 - Low Mileage',
      description: 'This is a well-maintained Toyota Camry with low mileage and excellent condition.',
      images: [new File([''], 'test.jpg')],
    };

    it('should pass for valid content with new images', () => {
      expect(step3Schema.safeParse(validStep3).success).toBe(true);
    });

    it('should pass for valid content with existing images', () => {
      const result = step3Schema.safeParse({
        ...validStep3,
        images: [],
        existingImageUrls: ['https://example.com/image.jpg'],
      });
      expect(result.success).toBe(true);
    });

    it('should fail for title too short', () => {
      const result = step3Schema.safeParse({ ...validStep3, title: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should fail for description too short', () => {
      const result = step3Schema.safeParse({ ...validStep3, description: 'Too short' });
      expect(result.success).toBe(false);
    });

    it('should fail when no images provided', () => {
      const result = step3Schema.safeParse({
        ...validStep3,
        images: [],
        existingImageUrls: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Step 4: Pricing & Contact', () => {
    const validStep4 = {
      price: '25000',
      currency: 'USD',
      governorateSlug: 'damascus',
      locationSlug: 'central-damascus',
      contactName: 'John Doe',
      contactPhone: '+963 123 456 789',
    };

    it('should pass for valid pricing and contact', () => {
      expect(step4Schema.safeParse(validStep4).success).toBe(true);
    });

    it('should pass with optional email', () => {
      const result = step4Schema.safeParse({
        ...validStep4,
        contactEmail: 'john@example.com',
        contactPreference: 'both',
      });
      expect(result.success).toBe(true);
    });

    it('should fail for invalid price', () => {
      const result = step4Schema.safeParse({ ...validStep4, price: 'abc' });
      expect(result.success).toBe(false);
    });

    it('should fail for zero price', () => {
      const result = step4Schema.safeParse({ ...validStep4, price: '0' });
      expect(result.success).toBe(false);
    });

    it('should accept price with commas', () => {
      const result = step4Schema.safeParse({ ...validStep4, price: '25,000' });
      expect(result.success).toBe(true);
    });

    it('should fail for missing contact phone', () => {
      const result = step4Schema.safeParse({ ...validStep4, contactPhone: '' });
      expect(result.success).toBe(false);
    });

    it('should fail for invalid email format', () => {
      const result = step4Schema.safeParse({ ...validStep4, contactEmail: 'notanemail' });
      expect(result.success).toBe(false);
    });

    it('should pass with empty email (optional)', () => {
      const result = step4Schema.safeParse({ ...validStep4, contactEmail: '' });
      expect(result.success).toBe(true);
    });
  });

  describe('Full Listing Schema', () => {
    const validListing = {
      // Step 1
      make: 'Toyota',
      model: 'Camry',
      year: '2022',
      // Step 2
      transmission: 'automatic',
      fuelType: 'gasoline',
      mileage: '50000',
      condition: 'used',
      // Step 3
      title: 'Beautiful Toyota Camry 2022 - Low Mileage',
      description: 'This is a well-maintained Toyota Camry with low mileage and excellent condition.',
      // Step 4
      price: '25000',
      currency: 'USD',
      governorateSlug: 'damascus',
      locationSlug: 'central-damascus',
      contactName: 'John Doe',
      contactPhone: '+963 123 456 789',
    };

    it('should pass for valid complete listing', () => {
      expect(listingSchema.safeParse(validListing).success).toBe(true);
    });

    it('should fail if any required field is missing', () => {
      const result = listingSchema.safeParse({ ...validListing, make: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateListingStep helper', () => {
    it('should validate step 1 correctly', () => {
      const result = validateListingStep(1, { make: 'Toyota', model: 'Camry', year: '2022' });
      expect(result.success).toBe(true);
    });

    it('should return errors for invalid step 1', () => {
      const result = validateListingStep(1, { make: '', model: '', year: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateListing helper', () => {
    it('should validate complete listing', () => {
      const result = validateListing({
        make: 'Toyota',
        model: 'Camry',
        year: '2022',
        transmission: 'automatic',
        fuelType: 'gasoline',
        mileage: '50000',
        condition: 'used',
        title: 'Beautiful Toyota Camry 2022 - Low Mileage',
        description: 'This is a well-maintained Toyota Camry with low mileage and excellent condition.',
        price: '25000',
        currency: 'USD',
        governorateSlug: 'damascus',
        locationSlug: 'central-damascus',
        contactName: 'John Doe',
        contactPhone: '+963 123 456 789',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getValidationErrors helper', () => {
    it('should return empty object for valid data', () => {
      const result = step1Schema.safeParse({ make: 'Toyota', model: 'Camry', year: '2022' });
      expect(getValidationErrors(result)).toEqual({});
    });

    it('should return errors as flat object', () => {
      const result = step1Schema.safeParse({ make: '', model: '', year: '' });
      const errors = getValidationErrors(result);
      expect(errors.make).toBe(ListingValidationMessages.makeRequired);
      expect(errors.model).toBe(ListingValidationMessages.modelRequired);
      expect(errors.year).toBe(ListingValidationMessages.yearRequired);
    });
  });
});
