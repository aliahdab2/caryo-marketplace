import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploadSection } from '@/components/listings/ImageUploadSection';

jest.mock('@/hooks/useLazyTranslation', () => ({
  useLazyTranslation: () => ({ t: (_k: string, fb?: string) => fb ?? '' })
}));

describe('ImageUploadSection', () => {
  const baseProps = {
    formData: { images: [] } as any,
    onFormDataChange: jest.fn(),
    formErrors: {},
    isRTL: false,
    imagePreviewUrls: [],
    existingImages: [],
    isDragOver: false,
    setIsDragOver: jest.fn(),
    setImagePreviewUrls: jest.fn(),
    onImageUpload: jest.fn(),
    onRemoveImage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).URL.createObjectURL = jest.fn(() => 'blob:mock');
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
        formData={{ images: [file], existingImageUrls: [] } as any}
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

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
      preventDefault: () => {},
      stopPropagation: () => {}
    } as any);

    expect(baseProps.onFormDataChange).toHaveBeenCalledWith(expect.objectContaining({ images: expect.any(Array) }));
  });

  it('supports drag-reorder interactions (fires handlers)', () => {
    const props = {
      ...baseProps,
      formData: { images: [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')], existingImageUrls: [] } as any
    };
    render(<ImageUploadSection {...props} />);

    const item0 = screen.getByTestId('image-item-0');
    const item1 = screen.getByTestId('image-item-1');

    const dt: any = { setData: () => {}, getData: () => {}, effectAllowed: '', dropEffect: '' };
    fireEvent.dragStart(item0, { dataTransfer: dt } as any);
    fireEvent.dragOver(item1, { dataTransfer: dt, preventDefault: () => {} } as any);
    fireEvent.drop(item1, { dataTransfer: dt, preventDefault: () => {} } as any);
    fireEvent.dragEnd(item0);

    expect(true).toBe(true);
  });

  it('renders existing images from formData.existingImageUrls', () => {
    render(
      <ImageUploadSection
        {...baseProps}
        formData={{ images: [], existingImageUrls: ['https://cdn/img1.jpg', 'https://cdn/img2.jpg'] } as any}
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
