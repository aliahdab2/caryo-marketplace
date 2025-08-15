import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ListingWizard from '@/components/listings/ListingWizard';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string, _vars?: any) => fb ?? '' , i18n: { language: 'en' }, ready: true })
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));

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
  (global as any).URL.createObjectURL = jest.fn(() => 'blob:mock');
  (global as any).URL.revokeObjectURL = jest.fn();
});

function fillStep1AndStep2(init?: any) {
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
        initialData={fillStep1AndStep2() as any}
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
});
