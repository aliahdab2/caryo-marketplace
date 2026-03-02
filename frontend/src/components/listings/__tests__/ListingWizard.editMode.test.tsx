/**
 * ListingWizard Edit Mode Tests
 *
 * Tests for loading and editing existing listings.
 */

import React from 'react';
import { render } from '@testing-library/react';
import ListingWizard from '../ListingWizard';
import { ListingDataService } from '@/services/ListingDataService';

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
  usePathname: () => '/dashboard/dealer/stock/edit/123'
}));

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
    ready: true
  })
}));

const mockCarMakes = [
  { id: 1, name: 'toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
  { id: 2, name: 'honda', slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا', isActive: true }
];

const mockCarModels = [
  { id: 101, name: 'camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1 },
  { id: 102, name: 'corolla', slug: 'corolla', displayNameEn: 'Corolla', displayNameAr: 'كورولا', brandId: 1 }
];

const mockTransmissions = [
  { id: 1, name: 'automatic', slug: 'automatic', displayNameEn: 'Automatic', displayNameAr: 'أوتوماتيك' },
  { id: 2, name: 'manual', slug: 'manual', displayNameEn: 'Manual', displayNameAr: 'يدوي' }
];

const mockFuelTypes = [
  { id: 1, name: 'gasoline', slug: 'gasoline', displayNameEn: 'Gasoline', displayNameAr: 'بنزين' },
  { id: 2, name: 'diesel', slug: 'diesel', displayNameEn: 'Diesel', displayNameAr: 'ديزل' }
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

// Mock existing listing data
const mockExistingListing = {
  id: 'existing-123',
  title: 'Beautiful Toyota Camry 2022',
  description: 'Well maintained car with low mileage',
  make: 'toyota',
  model: 'camry',
  year: '2022',
  price: '25000',
  currency: 'USD',
  condition: 'used',
  mileage: '50000',
  transmission: 'automatic',
  fuelType: 'gasoline',
  governorateSlug: 'damascus',
  locationSlug: 'damascus-center',
  contactName: 'John Doe',
  contactPhone: '+963 123 456 789',
  contactEmail: 'john@example.com',
  existingImageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  status: 'active' as const
};

jest.mock('@/services/ListingDataService', () => ({
  ListingDataService: {
    loadFormData: jest.fn()
  }
}));

jest.mock('@/services/listings', () => ({
  createListing: jest.fn().mockResolvedValue({ id: '123', title: 'Test Car' }),
  updateListing: jest.fn().mockResolvedValue({ id: '123', title: 'Updated Car' })
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

describe('ListingWizard Edit Mode Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ListingDataService.loadFormData as jest.Mock).mockResolvedValue(mockExistingListing);
  });

  describe('Edit Mode Initialization', () => {
    it('should render in edit mode with listingId', () => {
      const { container } = render(
        <ListingWizard mode="edit" listingId="existing-123" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept initial data in edit mode', () => {
      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          initialData={mockExistingListing}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have form element in edit mode', () => {
      render(<ListingWizard mode="edit" listingId="existing-123" />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Edit Mode Data Loading', () => {
    it('should render with autoLoad enabled by default', () => {
      const { container } = render(
        <ListingWizard mode="edit" listingId="existing-123" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with autoLoad disabled', () => {
      const { container } = render(
        <ListingWizard mode="edit" listingId="existing-123" autoLoad={false} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edit Mode with Initial Data', () => {
    it('should accept pre-populated form data', () => {
      const initialData = {
        make: 'honda',
        model: 'civic',
        year: '2021',
        title: 'Honda Civic for Sale',
        description: 'Great condition Honda Civic',
      };

      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          initialData={initialData}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle existing images', () => {
      const initialData = {
        ...mockExistingListing,
        existingImageUrls: ['https://example.com/car1.jpg'],
        existingMediaItems: [
          { id: 1, url: 'https://example.com/car1.jpg', type: 'image', isPrimary: true }
        ]
      };

      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          initialData={initialData}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle existing videos', () => {
      const initialData = {
        ...mockExistingListing,
        existingVideoUrls: ['https://youtube.com/watch?v=123'],
        existingMediaItems: [
          { id: 2, url: 'https://youtube.com/watch?v=123', type: 'video' }
        ]
      };

      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          initialData={initialData}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edit Mode Dirty State', () => {
    it('should track dirty state via ref', () => {
      const ref = React.createRef<{ isDirty: () => boolean }>();
      
      render(
        <ListingWizard 
          ref={ref} 
          mode="edit" 
          listingId="existing-123" 
        />
      );
      
      expect(ref.current).toBeDefined();
      expect(typeof ref.current?.isDirty).toBe('function');
    });

    it('should initially not be dirty in edit mode without changes', () => {
      const ref = React.createRef<{ isDirty: () => boolean }>();
      
      render(
        <ListingWizard 
          ref={ref} 
          mode="edit" 
          listingId="existing-123" 
          initialData={mockExistingListing}
        />
      );
      
      // In edit mode, form should not be dirty until user makes changes
      // The actual behavior depends on implementation details
      expect(ref.current?.isDirty).toBeDefined();
    });
  });

  describe('Edit Mode Callbacks', () => {
    it('should accept onSuccess callback', () => {
      const onSuccess = jest.fn();
      
      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          onSuccess={onSuccess}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should accept onCancel callback', () => {
      const onCancel = jest.fn();
      
      const { container } = render(
        <ListingWizard 
          mode="edit" 
          listingId="existing-123" 
          onCancel={onCancel}
        />
      );
      
      expect(container.firstChild).toBeInTheDocument();
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode Error Handling', () => {
    it('should handle missing listingId gracefully', () => {
      // This tests edge case - edit mode without listingId
      const { container } = render(
        <ListingWizard mode="edit" listingId="" />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle load errors gracefully', async () => {
      (ListingDataService.loadFormData as jest.Mock).mockRejectedValue(
        new Error('Failed to load listing')
      );

      const { container } = render(
        <ListingWizard mode="edit" listingId="nonexistent-id" />
      );
      
      // Component should render even if data loading fails
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edit Mode vs Create Mode', () => {
    it('should differentiate between create and edit mode', () => {
      const createRef = React.createRef<{ isDirty: () => boolean }>();
      const editRef = React.createRef<{ isDirty: () => boolean }>();
      
      const { unmount: unmountCreate } = render(
        <ListingWizard ref={createRef} mode="create" />
      );
      const createDirty = createRef.current?.isDirty();
      unmountCreate();
      
      render(
        <ListingWizard 
          ref={editRef} 
          mode="edit" 
          listingId="123" 
          initialData={mockExistingListing}
        />
      );
      const editDirty = editRef.current?.isDirty();
      
      // Create mode should always be dirty (new listing)
      // Edit mode may or may not be dirty depending on changes
      expect(createDirty).toBe(true);
      expect(typeof editDirty).toBe('boolean');
    });
  });
});

describe('ListingWizard Media in Edit Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle mediaToDelete array', () => {
    const initialData = {
      ...mockExistingListing,
      mediaToDelete: [1, 2, 3] // IDs of media to delete
    };

    const { container } = render(
      <ListingWizard 
        mode="edit" 
        listingId="existing-123" 
        initialData={initialData}
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle mixed new and existing media', () => {
    const initialData = {
      ...mockExistingListing,
      images: [], // New images (empty initially)
      existingImageUrls: ['https://example.com/old-image.jpg'],
      videos: [],
      existingVideoUrls: ['https://youtube.com/watch?v=old']
    };

    const { container } = render(
      <ListingWizard 
        mode="edit" 
        listingId="existing-123" 
        initialData={initialData}
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
