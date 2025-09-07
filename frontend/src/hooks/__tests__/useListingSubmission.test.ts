import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useListingSubmission } from '../useListingSubmission';

jest.mock('@/services/listings', () => ({
  createListing: jest.fn(async () => ({ id: 'new-id' })),
  updateListing: jest.fn(async () => ({ id: 'updated-id' })),
  uploadListingImage: jest.fn(async () => ({ imageKey: 'img-key' })),
}));

// Mock NextAuth and session hooks with consistent data
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => ({ 
    type: 'div', 
    props: { children } 
  }),
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER']
      },
      accessToken: 'test-token',
      expires: '2030-01-01T00:00:00.000Z'
    },
    status: 'authenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('@/hooks/useOptimizedSession', () => ({
  useOptimizedSession: () => ({
    user: {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
      roles: ['ROLE_USER']
    },
    isAuthenticated: true,
    isLoading: false,
    status: 'authenticated',
    session: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        roles: ['ROLE_USER']
      },
      accessToken: 'test-token',
      expires: '2030-01-01T00:00:00.000Z'
    },
    refreshSession: jest.fn()
  }),
  useOptimizedUser: () => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
    roles: ['ROLE_USER']
  })
}));

import { createListing, updateListing, uploadListingImage } from '@/services/listings';

const t = (key: string) => key;

function baseFormData() {
  return {
    id: '',
    title: 'Test Car',
    description: 'Great car',
    make: '',
    model: '',
    year: '2020',
    price: '25000',
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
    governorateId: undefined,
    locationId: undefined,
    state: '',
    zipCode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactPreference: 'email',
    images: [],
    videos: [],
    videoUrls: [],
    existingImageUrls: [],
    existingVideoUrls: [],
    status: 'active'
  } as unknown as import('@/types/listings').ListingFormData;
}

describe('useListingSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits create flow when validation passes', async () => {
    const formData = baseFormData();
    const setFormErrors = jest.fn();
    const setCurrentStep = jest.fn();
    const setError = jest.fn();
    const setIsSubmitting = jest.fn();
    const setShowSuccessAlert = jest.fn();
    const onSuccess = jest.fn();
    const validateStep = jest.fn(() => ({}));

    const { result } = renderHook(() => useListingSubmission({
      currentStep: 4,
      totalSteps: 4,
      mode: 'create',
      listingId: undefined,
      formData,
      t,
      validateStep,
      setFormErrors,
      setCurrentStep,
      setError,
      setIsSubmitting,
      setShowSuccessAlert,
      onSuccess,
    }));

    const event = { preventDefault: jest.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(validateStep).toHaveBeenCalled();
    // Now the hook automatically injects the user's email from session
    const expectedFormData = { ...formData, contactEmail: 'test@example.com' };
    expect(createListing).toHaveBeenCalledWith(expectedFormData);
    expect(onSuccess).toHaveBeenCalledWith('new-id');
  });

  it('submits edit flow and uploads images sequentially', async () => {
    const formData = { ...baseFormData(), images: [new File(["a"], 'a.jpg')], locationId: 123 } as unknown as import('@/types/listings').ListingFormData;
    const setFormErrors = jest.fn();
    const setCurrentStep = jest.fn();
    const setError = jest.fn();
    const setIsSubmitting = jest.fn();
    const setShowSuccessAlert = jest.fn();
    const onSuccess = jest.fn();
    const validateStep = jest.fn(() => ({}));

    const { result } = renderHook(() => useListingSubmission({
      currentStep: 4,
      totalSteps: 4,
      mode: 'edit',
      listingId: '42',
      formData,
      t,
      validateStep,
      setFormErrors,
      setCurrentStep,
      setError,
      setIsSubmitting,
      setShowSuccessAlert,
      onSuccess,
    }));

    const event = { preventDefault: jest.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(event);
    });

    // Now the hook automatically injects the user's email from session for edit flow too
    // In edit mode, it calls updateListing with listingId and updateData (partial object)
    const expectedUpdateData = {
      currency: 'USD',
      description: 'Great car',
      modelYear: 2020,
      locationId: 123,
      contactName: '',
      contactEmail: 'test@example.com',
      contactPhone: '',
      contactPreference: 'email',
      price: 25000,
      title: 'Test Car'
    };
    expect(updateListing).toHaveBeenCalledWith('42', expectedUpdateData);
    expect(uploadListingImage).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('updated-id');
  });

  it('does not submit when validation fails and sets errors', async () => {
    const formData = baseFormData();
    const setFormErrors = jest.fn();
    const setCurrentStep = jest.fn();
    const setError = jest.fn();
    const setIsSubmitting = jest.fn();
    const setShowSuccessAlert = jest.fn();
    const onSuccess = jest.fn();
    const validateStep = jest.fn(() => ({ title: 'Required' }));

    const { result } = renderHook(() => useListingSubmission({
      currentStep: 4,
      totalSteps: 4,
      mode: 'create',
      listingId: undefined,
      formData,
      t,
      validateStep,
      setFormErrors,
      setCurrentStep,
      setError,
      setIsSubmitting,
      setShowSuccessAlert,
      onSuccess,
    }));

    const event = { preventDefault: jest.fn() } as unknown as React.FormEvent;
    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(setFormErrors).toHaveBeenCalled();
    expect(createListing).not.toHaveBeenCalled();
    expect(updateListing).not.toHaveBeenCalled();
  });
});


