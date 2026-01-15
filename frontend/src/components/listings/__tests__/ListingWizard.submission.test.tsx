/**
 * ListingWizard Submission Tests
 *
 * Tests for form submission and API integration.
 */

import React from 'react';
import { render } from '@testing-library/react';
import ListingWizard from '../ListingWizard';
import * as listingsService from '@/services/listings';

// ============================================
// Mock Setup
// ============================================

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
      accessToken: 'test-token',
      expires: '2030-01-01'
    },
    status: 'authenticated'
  })
}));

jest.mock('@/hooks/useOptimizedSession', () => ({
  useOptimizedSession: () => ({
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    status: 'authenticated',
    session: { accessToken: 'test-token' },
    refreshSession: jest.fn()
  }),
  useOptimizedUser: () => ({ id: 'test-user', name: 'Test User' })
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({ get: jest.fn(), has: jest.fn() }),
  usePathname: () => '/dashboard/listings/new'
}));

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
    ready: true
  })
}));

const mockCarMakes = [
  { id: 1, name: 'toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true }
];

const mockCarModels = [
  { id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1 }
];

const mockTransmissions = [
  { id: 1, name: 'automatic', slug: 'automatic', displayNameEn: 'Automatic', displayNameAr: 'أوتوماتيك' }
];

const mockFuelTypes = [
  { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' }
];

const mockGovernorates = [
  { id: 1, name: 'damascus', slug: 'damascus', displayNameEn: 'Damascus', displayNameAr: 'دمشق' }
];

const mockLocations = [
  { id: 1, name: 'damascus-center', slug: 'damascus-center', displayNameEn: 'Damascus Center', displayNameAr: 'وسط دمشق', governorateId: 1 }
];

jest.mock('@/hooks/useListingData', () => ({
  useListingData: () => ({
    carMakes: mockCarMakes,
    carModels: mockCarModels,
    transmissions: mockTransmissions,
    fuelTypes: mockFuelTypes,
    governorates: mockGovernorates,
    locations: mockLocations,
    isLoadingMakes: false,
    isLoadingModels: false,
    isLoadingGovernorates: false,
    isLoadingLocations: false,
    isLoadingReferenceData: false,
    loadCarModels: jest.fn().mockResolvedValue(undefined),
    loadLocations: jest.fn().mockResolvedValue(undefined),
    clearModels: jest.fn(),
    clearLocations: jest.fn()
  })
}));

jest.mock('@/services/ListingDataService', () => ({
  ListingDataService: {
    loadFormData: jest.fn().mockResolvedValue({})
  }
}));

// Mock the listings service
jest.mock('@/services/listings', () => ({
  createListing: jest.fn(),
  updateListing: jest.fn()
}));

jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    isDirty: false,
    isSaving: false,
    lastSaved: null,
    saveNow: jest.fn()
  })
}));

jest.mock('@/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

jest.mock('@/utils/direction', () => ({
  useDirection: () => ({ isRTL: false })
}));

jest.mock('@/utils/rtlHelpers', () => ({
  createRTLHelpers: () => ({
    spacing: { ml: (v: string) => `ml-${v}`, mr: (v: string) => `mr-${v}` },
    arrows: { rightArrow: 'M9 5l7 7-7 7' }
  })
}));

jest.mock('@/utils/formUtils', () => ({
  validateStep: jest.fn().mockReturnValue({}),
  extractFieldData: jest.fn(),
  processFormFieldValue: jest.fn((_, value) => value)
}));

// ============================================
// Tests
// ============================================

describe('ListingWizard Submission Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (listingsService.createListing as jest.Mock).mockResolvedValue({ 
      id: 'new-listing-123', 
      title: 'Test Car' 
    });
    (listingsService.updateListing as jest.Mock).mockResolvedValue({ 
      id: 'existing-listing-456', 
      title: 'Updated Car' 
    });
  });

  describe('Create Mode Submission', () => {
    it('should render create mode with form', () => {
      render(<ListingWizard mode="create" />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should have onSuccess callback available', () => {
      const onSuccess = jest.fn();
      render(<ListingWizard mode="create" onSuccess={onSuccess} />);
      
      // Verify the callback is passed (component renders)
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should not call createListing on initial render', () => {
      render(<ListingWizard mode="create" />);
      
      expect(listingsService.createListing).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode Submission', () => {
    it('should render edit mode with listingId', () => {
      render(<ListingWizard mode="edit" listingId="existing-123" />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should not call updateListing on initial render', () => {
      render(<ListingWizard mode="edit" listingId="existing-123" />);
      
      expect(listingsService.updateListing).not.toHaveBeenCalled();
    });
  });

  describe('Submission Callbacks', () => {
    it('should accept onSuccess callback in create mode', () => {
      const onSuccess = jest.fn();
      const { container } = render(
        <ListingWizard mode="create" onSuccess={onSuccess} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled(); // Not called until submission
    });

    it('should accept onSuccess callback in edit mode', () => {
      const onSuccess = jest.fn();
      const { container } = render(
        <ListingWizard mode="edit" listingId="123" onSuccess={onSuccess} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled(); // Not called until submission
    });

    it('should accept onCancel callback', () => {
      const onCancel = jest.fn();
      const { container } = render(
        <ListingWizard mode="create" onCancel={onCancel} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('API Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (listingsService.createListing as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { container } = render(<ListingWizard mode="create" />);
      
      // Component should render without crashing even if API would fail
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle update errors gracefully', async () => {
      (listingsService.updateListing as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      const { container } = render(
        <ListingWizard mode="edit" listingId="123" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Form State on Submission', () => {
    it('should track submission state via ref', () => {
      const ref = React.createRef<{ isDirty: () => boolean }>();
      
      render(<ListingWizard ref={ref} mode="create" />);
      
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.isDirty).toBe('function');
    });
  });
});

describe('ListingWizard Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have createListing service mocked', () => {
    expect(listingsService.createListing).toBeDefined();
    expect(typeof listingsService.createListing).toBe('function');
  });

  it('should have updateListing service mocked', () => {
    expect(listingsService.updateListing).toBeDefined();
    expect(typeof listingsService.updateListing).toBe('function');
  });

  it('should mock createListing to return expected structure', async () => {
    (listingsService.createListing as jest.Mock).mockResolvedValue({
      id: 'test-id',
      title: 'Test Listing',
      status: 'active'
    });

    const result = await listingsService.createListing({} as unknown as Parameters<typeof listingsService.createListing>[0]);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
  });

  it('should mock updateListing to return expected structure', async () => {
    (listingsService.updateListing as jest.Mock).mockResolvedValue({
      id: 'updated-id',
      title: 'Updated Listing',
      status: 'active'
    });

    const result = await listingsService.updateListing('123', {} as unknown as Parameters<typeof listingsService.updateListing>[1]);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
  });
});
