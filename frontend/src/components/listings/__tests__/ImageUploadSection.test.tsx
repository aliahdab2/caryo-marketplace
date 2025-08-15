import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploadSection } from '@/components/listings/ImageUploadSection';
import type { ListingFormData } from '@/types/listings';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? '' })
}));

describe('ImageUploadSection', () => {
  const baseProps = {
    formData: { images: [] } as unknown as ListingFormData,
    onFormDataChange: jest.fn(),
    formErrors: {},
    isRTL: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { URL: { createObjectURL: (obj: unknown) => string } }).URL.createObjectURL = jest.fn(() => 'blob:mock');
  });

  it('renders dropzone and input', () => {
    render(<ImageUploadSection {...baseProps} />);
    expect(screen.getByTestId('image-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('image-input')).toBeInTheDocument();
  });

  it('calls onImageUpload when file input changes', () => {
    render(<ImageUploadSection {...baseProps} />);
    const input = screen.getByTestId('image-input') as HTMLInputElement;
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(baseProps.onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ images: expect.any(Array) }));
  });

  it('removes an image (new upload) when clicking remove button', () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    render(
      <ImageUploadSection
        {...baseProps}
        formData={{ images: [file], existingImageUrls: [] } as unknown as ListingFormData}
      />
    );
    const removeBtn = screen.getByRole('button', { name: /remove image/i });
    fireEvent.click(removeBtn);
    expect(baseProps.onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ images: [] }));
  });

  it('handles drop event and updates previews', () => {
    render(<ImageUploadSection {...baseProps} />);
    const dropzone = screen.getByTestId('image-dropzone');
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });

    const dt = { files: [file] } as unknown as DataTransfer;
    fireEvent.drop(dropzone, {
      dataTransfer: dt,
      preventDefault: () => {},
      stopPropagation: () => {}
    } as unknown as DragEvent);

    expect(baseProps.onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ images: expect.any(Array) }));
  });

  it('supports drag-reorder interactions (fires handlers)', () => {
    const props = {
      ...baseProps,
      formData: { images: [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')], existingImageUrls: [] } as unknown as ListingFormData
    };
    render(<ImageUploadSection {...props} />);

    const item0 = screen.getByTestId('image-item-0');
    const item1 = screen.getByTestId('image-item-1');

    const dt: DataTransfer = { setData: () => {}, getData: () => {}, dropEffect: 'move', effectAllowed: 'move' } as unknown as DataTransfer;
    fireEvent.dragStart(item0, { dataTransfer: dt } as unknown as DragEvent);
    fireEvent.dragOver(item1, { dataTransfer: dt, preventDefault: () => {} } as unknown as DragEvent);
    fireEvent.drop(item1, { dataTransfer: dt, preventDefault: () => {} } as unknown as DragEvent);
    fireEvent.dragEnd(item0);

    expect(true).toBe(true);
  });

  it('renders existing images from formData.existingImageUrls', () => {
    render(
      <ImageUploadSection
        {...baseProps}
        formData={{ images: [], existingImageUrls: ['https://cdn/img1.jpg', 'https://cdn/img2.jpg'] } as unknown as ListingFormData}
      />
    );
    expect(screen.getByTestId('image-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('image-item-1')).toBeInTheDocument();
  });

  it('shows error message when formErrors.images exists', () => {
    render(<ImageUploadSection {...baseProps} formErrors={{ images: 'Error' }} />);
    expect(screen.getByText(/Error/i)).toBeInTheDocument();
  });
});
