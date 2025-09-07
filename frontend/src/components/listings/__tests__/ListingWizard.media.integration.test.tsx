import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListingWizard from '@/components/listings/ListingWizard';
import type { ListingFormData } from '@/types/listings';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? '' , i18n: { language: 'en' }, ready: true })
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

// Mock NextAuth and session hooks
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => ({ type: 'div', props: { children } }),
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

jest.mock('@/hooks/useListingData', () => ({
  useListingData: () => ({
    governorates: [],
    locations: [],
    carMakes: [],
    carModels: [],
    transmissions: [],
    fuelTypes: [],
    isLoadingGovernorates: false,
    isLoadingLocations: false,
    isLoadingMakes: false,
    isLoadingModels: false,
    isLoadingReferenceData: false,
    loadCarModels: jest.fn(),
    loadLocations: jest.fn(),
    clearModels: jest.fn(),
    clearLocations: jest.fn(),
  })
}));

jest.mock('@/utils/formUtils', () => ({
  validateStep: () => ({}),
}));

// Basic URL object mocks
beforeEach(() => {
  (global as unknown as { URL: { createObjectURL: (obj: unknown) => string; revokeObjectURL: (url: string) => void } }).URL.createObjectURL = jest.fn(() => 'blob:mock');
  (global as unknown as { URL: { createObjectURL: (obj: unknown) => string; revokeObjectURL: (url: string) => void } }).URL.revokeObjectURL = jest.fn();
});

function fillStep1AndStep2(init?: Partial<Record<string, unknown>>) {
  return {
    id: '',
    title: 'Title',
    description: 'Desc',
    make: 'toyota',
    makeId: 1,
    model: 'corolla',
    modelId: 1,
    year: '2020',
    price: '10000',
    currency: 'USD',
    transmission: 'automatic',
    transmissionId: 1,
    fuelType: 'gasoline',
    fuelTypeId: 1,
    images: [],
    videos: [],
    videoUrls: [],
    existingImageUrls: [],
    existingVideoUrls: [],
    ...init,
  };
}

describe('ListingWizard Step 3 media integration', () => {
  it('navigates to Step 3 and handles image upload and YouTube URL', () => {
    render(
      <ListingWizard
        mode="create"
        autoLoad={false}
        autoSave={false}
        showHeader={false}
        initialData={fillStep1AndStep2() as ListingFormData}
      />
    );

    // Click step 2 then step 3 (only next immediate step is allowed)
    const buttons = screen.getAllByRole('button');
    const step2Btn = buttons.find(b => (b.textContent || '').trim() === '2');
    expect(step2Btn).toBeTruthy();
    if (step2Btn) fireEvent.click(step2Btn);

    const buttonsAfterStep2 = screen.getAllByRole('button');
    const step3Btn2 = buttonsAfterStep2.find(b => (b.textContent || '').trim() === '3');
    expect(step3Btn2).toBeTruthy();
    if (step3Btn2) fireEvent.click(step3Btn2);

    // Image: upload via file input
    const imageInput = screen.getByTestId('image-input') as HTMLInputElement;
    const imgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(imageInput, { target: { files: [imgFile] } });
    expect(screen.getByTestId('image-item-0')).toBeInTheDocument();

    // Video URL: open toggle and set a youtube url
    const toggleUrlBtn = screen.getByRole('button', { name: /Add Video URL/i });
    fireEvent.click(toggleUrlBtn);
    const urlInput = screen.getByTestId('video-url-input') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=abc123' } });
    expect(urlInput.value).toContain('youtube.com/watch');
  });

  it('uploads and removes a video file in Step 3 via VideoSection', () => {
    render(
      <ListingWizard
        mode="create"
        autoLoad={false}
        autoSave={false}
        showHeader={false}
        initialData={fillStep1AndStep2() as ListingFormData}
      />
    );

    // Navigate to step 3
    const step2Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '2');
    if (step2Btn) fireEvent.click(step2Btn);
    const step3Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '3');
    if (step3Btn) fireEvent.click(step3Btn);

    // Expand upload section and upload a file
    const uploadToggle = screen.getByRole('button', { name: /Upload Video File/i });
    fireEvent.click(uploadToggle);

    const input = screen.getByTestId('video-input') as HTMLInputElement;
    const vidFile = new File(['video-bytes'], 'clip.mp4', { type: 'video/mp4' });
    fireEvent.change(input, { target: { files: [vidFile] } });

    // Preview should be visible
    expect(screen.getByText(/Video Preview/i)).toBeInTheDocument();

    // Remove the video
    const removeBtn = screen.getByRole('button', { name: /Remove video/i });
    fireEvent.click(removeBtn);

    // Preview should be gone
    expect(screen.queryByText(/Video Preview/i)).not.toBeInTheDocument();
  });

  it('uploads and removes an image in Step 3', () => {
    render(
      <ListingWizard
        mode="create"
        autoLoad={false}
        autoSave={false}
        showHeader={false}
        initialData={fillStep1AndStep2() as ListingFormData}
      />
    );

    // Navigate to step 3
    const step2Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '2');
    if (step2Btn) fireEvent.click(step2Btn);
    const step3Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '3');
    if (step3Btn) fireEvent.click(step3Btn);

    // Upload an image
    const imageInput = screen.getByTestId('image-input') as HTMLInputElement;
    const imgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(imageInput, { target: { files: [imgFile] } });

    // Preview should be visible
    expect(screen.getByTestId('image-item-0')).toBeInTheDocument();

    // Remove the image
    const removeBtn = screen.getByLabelText(/Remove image 1/i);
    fireEvent.click(removeBtn);

    // Preview should be gone
    expect(screen.queryByTestId('image-item-0')).not.toBeInTheDocument();
  });

  it('adds and removes a YouTube URL in Step 3', () => {
    render(
      <ListingWizard
        mode="create"
        autoLoad={false}
        autoSave={false}
        showHeader={false}
        initialData={fillStep1AndStep2() as ListingFormData}
      />
    );

    // Navigate to step 3
    const step2Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '2');
    if (step2Btn) fireEvent.click(step2Btn);
    const step3Btn = screen.getAllByRole('button').find(b => (b.textContent || '').trim() === '3');
    if (step3Btn) fireEvent.click(step3Btn);

    // Open URL input and add a YouTube URL
    const toggleUrlBtn = screen.getByRole('button', { name: /Add Video URL/i });
    fireEvent.click(toggleUrlBtn);
    const urlInput = screen.getByTestId('video-url-input') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://youtube.com/watch?v=abc123' } });
    expect(urlInput.value).toContain('youtube.com/watch');

    // Remove the URL via the remove button
    const removeUrlBtn = screen.getByRole('button', { name: /Remove video URL/i });
    fireEvent.click(removeUrlBtn);

    // Ensure URL input cleared and remove button gone
    expect((screen.getByTestId('video-url-input') as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('button', { name: /Remove video URL/i })).not.toBeInTheDocument();
  });
});
