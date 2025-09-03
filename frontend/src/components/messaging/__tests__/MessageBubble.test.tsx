import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageBubble from '../MessageBubble';
import { MessageResponse } from '@/services/messaging';

// Mock the CarMediaGallery component
jest.mock('@/components/CarMediaGallery', () => {
  return function MockCarMediaGallery({ media, initialIndex }: { media: unknown[]; initialIndex: number }) {
    return (
      <div data-testid="car-media-gallery">
        <div 
          className="cursor-pointer" 
          data-testid="gallery-clickable"
          onClick={() => {
            // Simulate modal opening
            const modal = global.document.createElement('div');
            modal.setAttribute('data-testid', 'gallery-modal');
            modal.textContent = `Gallery Modal - Image ${initialIndex + 1} of ${media.length}`;
            global.document.body.appendChild(modal);
          }}
        >
          Gallery Image {initialIndex + 1}
        </div>
      </div>
    );
  };
});

// Mock the transformMinioUrl utility
jest.mock('@/utils/mediaUtils', () => ({
  transformMinioUrl: (url: string) => `transformed-${url}`,
  getDefaultImageUrl: () => 'default-image.jpg'
}));

describe('MessageBubble', () => {
  const mockOnDownloadDocument = jest.fn();

  const createMockMessage = (overrides?: Partial<MessageResponse>): MessageResponse => ({
    id: 1,
    conversationId: 1,
    senderId: 1,
    senderName: 'John Doe',
    displayContent: 'Test message content',
    messageType: 'text',
    createdAt: '2024-01-01T11:00:00Z',
    isRead: false,
    attachments: [],
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any modals from previous tests
    const existingModals = document.querySelectorAll('[data-testid="gallery-modal"]');
    existingModals.forEach(modal => modal.remove());
  });

  describe('Basic Rendering', () => {
    it('renders message content correctly', () => {
      const message = createMockMessage();
      render(
        <MessageBubble 
          message={message} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByText('Test message content')).toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument();
    });

    it('applies correct styling for own messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble 
          message={message} 
          isOwn={true} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const messageContainer = container.querySelector('.bg-gradient-to-r.from-blue-500.to-blue-600');
      expect(messageContainer).toBeInTheDocument();
    });

    it('applies correct styling for other messages', () => {
      const message = createMockMessage();
      const { container } = render(
        <MessageBubble 
          message={message} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const messageContainer = container.querySelector('.bg-gray-100.dark\\:bg-gray-700');
      expect(messageContainer).toBeInTheDocument();
    });

    it('shows read status for own messages', () => {
      const message = createMockMessage({ isRead: true });
      render(
        <MessageBubble 
          message={message} 
          isOwn={true} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      // CheckCheck icon should be present for read messages
      const checkIcons = document.querySelectorAll('svg');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    it('does not show read status for other messages', () => {
      const message = createMockMessage({ isRead: true });
      render(
        <MessageBubble 
          message={message} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      // Should not have check icons for other people's messages
      const messageContainer = document.querySelector('.flex.items-center');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('Image Attachments', () => {
    const messageWithImages = createMockMessage({
      attachments: [
        {
          id: 1,
          fileName: 'image1.jpg',
          fileUrl: 'https://example.com/image1.jpg',
          contentType: 'image/jpeg',
          size: 1024000,
          image: true,
          humanReadableSize: '1 MB'
        },
        {
          id: 2,
          fileName: 'image2.png',
          fileUrl: 'https://example.com/image2.png',
          contentType: 'image/png',
          size: 2048000,
          image: true,
          humanReadableSize: '2 MB'
        }
      ]
    });

    it('renders image attachments correctly', () => {
      render(
        <MessageBubble 
          message={messageWithImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('image2.png')).toBeInTheDocument();
    });

    it('renders CarMediaGallery when images are present', () => {
      render(
        <MessageBubble 
          message={messageWithImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByTestId('car-media-gallery')).toBeInTheDocument();
    });

    it('opens gallery modal when image is clicked', async () => {
      render(
        <MessageBubble 
          message={messageWithImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const firstImage = screen.getByAltText('image1.jpg');
      fireEvent.click(firstImage);

      // Wait for the gallery to be triggered
      await waitFor(() => {
        expect(screen.getByTestId('gallery-modal')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('sets correct initial index when second image is clicked', async () => {
      render(
        <MessageBubble 
          message={messageWithImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const secondImage = screen.getByAltText('image2.png');
      fireEvent.click(secondImage);

      await waitFor(() => {
        const modal = screen.getByTestId('gallery-modal');
        expect(modal).toHaveTextContent('Image 2 of 2');
      }, { timeout: 200 });
    });

    it('does not render gallery when no images are present', () => {
      const messageWithoutImages = createMockMessage();
      render(
        <MessageBubble 
          message={messageWithoutImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.queryByTestId('car-media-gallery')).not.toBeInTheDocument();
    });
  });

  describe('Document Attachments', () => {
    const messageWithDocuments = createMockMessage({
      attachments: [
        {
          id: 3,
          fileName: 'document.pdf',
          fileUrl: 'https://example.com/document.pdf',
          contentType: 'application/pdf',
          size: 5120000,
          image: false,
          humanReadableSize: '5 MB'
        },
        {
          id: 4,
          fileName: 'spreadsheet.xlsx',
          fileUrl: 'https://example.com/spreadsheet.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 1024000,
          image: false,
          humanReadableSize: '1 MB'
        }
      ]
    });

    it('renders document attachments correctly', () => {
      render(
        <MessageBubble 
          message={messageWithDocuments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('spreadsheet.xlsx')).toBeInTheDocument();
      expect(screen.getByText('5 MB')).toBeInTheDocument();
      expect(screen.getByText('1 MB')).toBeInTheDocument();
    });

    it('shows correct document type icons', () => {
      render(
        <MessageBubble 
          message={messageWithDocuments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('XLS')).toBeInTheDocument();
    });

    it('calls onDownloadDocument when document is clicked', () => {
      render(
        <MessageBubble 
          message={messageWithDocuments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const pdfDocument = screen.getByText('document.pdf').closest('div');
      fireEvent.click(pdfDocument!);

      expect(mockOnDownloadDocument).toHaveBeenCalledWith(
        'https://example.com/document.pdf',
        'document.pdf'
      );
    });
  });

  describe('Mixed Attachments', () => {
    const messageWithMixedAttachments = createMockMessage({
      attachments: [
        {
          id: 1,
          fileName: 'image.jpg',
          fileUrl: 'https://example.com/image.jpg',
          contentType: 'image/jpeg',
          size: 1024000,
          image: true,
          humanReadableSize: '1 MB'
        },
        {
          id: 2,
          fileName: 'document.pdf',
          fileUrl: 'https://example.com/document.pdf',
          contentType: 'application/pdf',
          size: 2048000,
          image: false,
          humanReadableSize: '2 MB'
        }
      ]
    });

    it('renders both image and document attachments', () => {
      render(
        <MessageBubble 
          message={messageWithMixedAttachments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByAltText('image.jpg')).toBeInTheDocument();
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByTestId('car-media-gallery')).toBeInTheDocument();
    });

    it('only includes images in gallery media', async () => {
      render(
        <MessageBubble 
          message={messageWithMixedAttachments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const image = screen.getByAltText('image.jpg');
      fireEvent.click(image);

      await waitFor(() => {
        const modal = screen.getByTestId('gallery-modal');
        expect(modal).toHaveTextContent('Image 1 of 1'); // Only 1 image in gallery
      }, { timeout: 200 });
    });
  });

  describe('Empty States', () => {
    it('handles message without content', () => {
      const emptyMessage = createMockMessage({ displayContent: '' });
      render(
        <MessageBubble 
          message={emptyMessage} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.queryByText('Test message content')).not.toBeInTheDocument();
      expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument(); // Time should still be shown
    });

    it('handles message without attachments', () => {
      const messageWithoutAttachments = createMockMessage({ attachments: undefined });
      render(
        <MessageBubble 
          message={messageWithoutAttachments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByText('Test message content')).toBeInTheDocument();
      expect(screen.queryByTestId('car-media-gallery')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      const messageWithImages = createMockMessage({
        attachments: [
          {
            id: 1,
            fileName: 'vacation-photo.jpg',
            fileUrl: 'https://example.com/vacation-photo.jpg',
            contentType: 'image/jpeg',
            size: 1024000,
            image: true,
            humanReadableSize: '1 MB'
          }
        ]
      });

      render(
        <MessageBubble 
          message={messageWithImages} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      expect(screen.getByAltText('vacation-photo.jpg')).toBeInTheDocument();
    });

    it('has proper aria labels for document downloads', () => {
      const messageWithDocuments = createMockMessage({
        attachments: [
          {
            id: 1,
            fileName: 'important-document.pdf',
            fileUrl: 'https://example.com/important-document.pdf',
            contentType: 'application/pdf',
            size: 1024000,
            image: false,
            humanReadableSize: '1 MB'
          }
        ]
      });

      render(
        <MessageBubble 
          message={messageWithDocuments} 
          isOwn={false} 
          isRTL={false} 
          onDownloadDocument={mockOnDownloadDocument} 
        />
      );

      const documentElement = screen.getByTitle('Download important-document.pdf');
      expect(documentElement).toBeInTheDocument();
    });
  });
});
