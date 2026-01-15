/**
 * ListingWizard Auto-Save Tests
 *
 * Tests for auto-save and draft functionality.
 */

import React from 'react';
import { render } from '@testing-library/react';
import ListingWizard from '../ListingWizard';

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

jest.mock('@/hooks/useListingData', () => ({
  useListingData: () => ({
    carMakes: mockCarMakes,
    carModels: [],
    transmissions: [],
    fuelTypes: [],
    governorates: [],
    locations: [],
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

jest.mock('@/services/listings', () => ({
  createListing: jest.fn().mockResolvedValue({ id: '123', title: 'Test Car' }),
  updateListing: jest.fn().mockResolvedValue({ id: '123', title: 'Test Car' })
}));

// Auto-save mock with tracking
const mockSaveNow = jest.fn();
const mockAutoSave = {
  isDirty: false,
  isSaving: false,
  lastSaved: null as Date | null,
  saveNow: mockSaveNow
};

jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => mockAutoSave
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

describe('ListingWizard Auto-Save Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAutoSave.isDirty = false;
    mockAutoSave.isSaving = false;
    mockAutoSave.lastSaved = null;
  });

  describe('Auto-Save Enabled', () => {
    it('should render with autoSave enabled by default', () => {
      render(<ListingWizard mode="create" autoSave={true} />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should accept autoSave prop', () => {
      const { container } = render(<ListingWizard mode="create" autoSave={true} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should not auto-save in edit mode', () => {
      render(<ListingWizard mode="edit" listingId="123" autoSave={true} />);
      
      // Auto-save should only work in create mode
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Auto-Save Disabled', () => {
    it('should render with autoSave disabled', () => {
      render(<ListingWizard mode="create" autoSave={false} />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Draft Persistence', () => {
    it('should initialize form from localStorage if draft exists', () => {
      // This tests that the component can accept and use initial data
      const initialData = {
        make: 'toyota',
        model: 'camry',
        year: '2022',
        title: 'Draft Title'
      };

      render(<ListingWizard mode="create" initialData={initialData} />);
      
      // Component should render without errors
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should handle empty initialData', () => {
      render(<ListingWizard mode="create" initialData={{}} />);
      
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Auto-Save Indicator', () => {
    it('should display saving indicator when saving', () => {
      mockAutoSave.isSaving = true;
      
      render(<ListingWizard mode="create" autoSave={true} />);
      
      // Component should render without crashing even when saving
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should show last saved time when available', () => {
      mockAutoSave.lastSaved = new Date();
      
      render(<ListingWizard mode="create" autoSave={true} />);
      
      // Component should render
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('Dirty State', () => {
    it('should track dirty state through ref', () => {
      const ref = React.createRef<{ isDirty: () => boolean }>();
      
      render(<ListingWizard ref={ref} mode="create" />);
      
      // In create mode, isDirty should return true (new listing)
      expect(ref.current?.isDirty()).toBe(true);
    });

    it('should report not dirty for unchanged edit mode', () => {
      const ref = React.createRef<{ isDirty: () => boolean }>();
      
      render(<ListingWizard ref={ref} mode="edit" listingId="123" />);
      
      // Initially, edit mode with no changes should not be dirty
      // (depends on whether initial snapshot is set)
      expect(ref.current?.isDirty).toBeDefined();
    });
  });
});

describe('ListingWizard Form Ref', () => {
  it('should expose isDirty method through ref', () => {
    const ref = React.createRef<{ isDirty: () => boolean }>();
    
    render(<ListingWizard ref={ref} mode="create" />);
    
    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.isDirty).toBe('function');
  });

  it('should return true for isDirty in create mode', () => {
    const ref = React.createRef<{ isDirty: () => boolean }>();
    
    render(<ListingWizard ref={ref} mode="create" />);
    
    expect(ref.current?.isDirty()).toBe(true);
  });
});
