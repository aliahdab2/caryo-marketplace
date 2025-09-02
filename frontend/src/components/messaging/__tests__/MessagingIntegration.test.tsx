import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from '../MessageBubble';
import MessageInput from '../MessageInput';
import { MessageResponse } from '@/services/messaging';

// Mock the CarMediaGallery component
jest.mock('@/components/CarMediaGallery', () => {
  return function MockCarMediaGallery({ media, initialIndex }: any) {
    const handleClick = () => {
      // Simulate modal opening with keyboard support
      if (typeof document !== 'undefined') {
        const modal = document.createElement('div');
        modal.setAttribute('data-testid', 'gallery-modal');
        modal.setAttribute('tabindex', '0');
        modal.textContent = `Gallery Modal - Image ${initialIndex + 1} of ${media.length}`;
        
        // Add keyboard event listener
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            modal.remove();
          }
        });
        
        document.body.appendChild(modal);
        modal.focus();
      }
    };

    return (
      <div data-testid="car-media-gallery">
        <div 
          className="cursor-pointer" 
          data-testid="gallery-clickable"
          onClick={handleClick}
        >
          Gallery Image {initialIndex + 1}
        </div>
      </div>
    );
  };
});

// Mock FileUpload component
jest.mock('../FileUpload', () => {
  return function MockFileUpload({ onFilesSelected, selectedFiles, onRemoveFile }: any) {
    return (
      <div data-testid="file-upload">
        <input
          type="file"
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files) {
              onFilesSelected(Array.from(e.target.files));
            }
          }}
          multiple
        />
        {selectedFiles.map((file: File, index: number) => (
          <div key={index} data-testid={`selected-file-${index}`}>
            {file.name}
            <button
              onClick={() => onRemoveFile(index)}
              data-testid={`remove-file-${index}`}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    );
  };
});

// Mock utilities
jest.mock('@/utils/mediaUtils', () => ({
  transformMinioUrl: (url: string) => `transformed-${url}`,
  getDefaultImageUrl: () => 'default-image.jpg'
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Messaging Integration Tests', () => {
  const createMockMessage = (overrides?: Partial<MessageResponse>): MessageResponse => ({
    id: 1,
    conversationId: 1,
    senderId: 1,
    senderName: 'John Doe',
    displayContent: 'Test message content',
    messageType: 'TEXT',
    createdAt: '2024-01-01T10:00:00Z',
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

  describe('Complete Messaging Flow', () => {
    it('should handle complete message sending flow with text', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      const mockSetMessage = jest.fn();
      const mockSetFiles = jest.fn();

      // Render message input
      render(
        <MessageInput
          newMessage=""
          setNewMessage={mockSetMessage}
          onSendMessage={mockSendMessage}
          selectedFiles={[]}
          setSelectedFiles={mockSetFiles}
          sending={false}
          uploading={false}
          isRTL={false}
          conversationId={1}
          onUploadProgress={jest.fn()}
        />
      );

      // Initially, send button should not be visible
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      // Type a message
      const textarea = screen.getByPlaceholderText('typeMessage');
      await user.type(textarea, 'Hello world!');

      expect(mockSetMessage).toHaveBeenCalledWith('Hello world!');

      // Re-render with the new message to simulate state update
      render(
        <MessageInput
          newMessage="Hello world!"
          setNewMessage={mockSetMessage}
          onSendMessage={mockSendMessage}
          selectedFiles={[]}
          setSelectedFiles={mockSetFiles}
          sending={false}
          uploading={false}
          isRTL={false}
          conversationId={1}
          onUploadProgress={jest.fn()}
        />
      );

      // Send button should now be visible
      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).not.toBeDisabled();

      // Click send button
      fireEvent.click(sendButton);
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle complete message sending flow with files', async () => {
      const user = userEvent.setup();
      const mockSendMessage = jest.fn();
      const mockSetMessage = jest.fn();
      const mockSetFiles = jest.fn();

      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      // Render with selected files
      render(
        <MessageInput
          newMessage=""
          setNewMessage={mockSetMessage}
          onSendMessage={mockSendMessage}
          selectedFiles={[testFile]}
          setSelectedFiles={mockSetFiles}
          sending={false}
          uploading={false}
          isRTL={false}
          conversationId={1}
          onUploadProgress={jest.fn()}
        />
      );

      // Send button should be visible due to selected files
      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).not.toBeDisabled();

      // File should be displayed
      expect(screen.getByTestId('selected-file-0')).toHaveTextContent('test.jpg');

      // Send message with file
      fireEvent.click(sendButton);
      expect(mockSendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle message display and image gallery interaction', async () => {
      const mockDownload = jest.fn();

      const messageWithImages = createMockMessage({
        displayContent: 'Check out these photos!',
        attachments: [
          {
            id: 1,
            fileName: 'photo1.jpg',
            fileUrl: 'https://example.com/photo1.jpg',
            contentType: 'image/jpeg',
            size: 1024000,
            image: true,
            humanReadableSize: '1 MB'
          },
          {
            id: 2,
            fileName: 'photo2.png',
            fileUrl: 'https://example.com/photo2.png',
            contentType: 'image/png',
            size: 2048000,
            image: true,
            humanReadableSize: '2 MB'
          }
        ]
      });

      render(
        <MessageBubble
          message={messageWithImages}
          isOwn={false}
          isRTL={false}
          onDownloadDocument={mockDownload}
        />
      );

      // Message content should be displayed
      expect(screen.getByText('Check out these photos!')).toBeInTheDocument();

      // Images should be displayed
      expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('photo2.png')).toBeInTheDocument();

      // Gallery should be present
      expect(screen.getByTestId('car-media-gallery')).toBeInTheDocument();

      // Click on first image to open gallery
      const firstImage = screen.getByAltText('photo1.jpg');
      fireEvent.click(firstImage);

      // Gallery modal should open
      await waitFor(() => {
        expect(screen.getByTestId('gallery-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('gallery-modal');
      expect(modal).toHaveTextContent('Image 1 of 2');

      // Test keyboard navigation (ESC to close)
      fireEvent.keyDown(modal, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('gallery-modal')).not.toBeInTheDocument();
      });
    });

    it('should handle mixed content messages (text + images + documents)', async () => {
      const mockDownload = jest.fn();

      const mixedMessage = createMockMessage({
        displayContent: 'Here are the files you requested',
        attachments: [
          {
            id: 1,
            fileName: 'screenshot.png',
            fileUrl: 'https://example.com/screenshot.png',
            contentType: 'image/png',
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

      render(
        <MessageBubble
          message={mixedMessage}
          isOwn={true}
          isRTL={false}
          onDownloadDocument={mockDownload}
        />
      );

      // Text content
      expect(screen.getByText('Here are the files you requested')).toBeInTheDocument();

      // Image attachment
      expect(screen.getByAltText('screenshot.png')).toBeInTheDocument();

      // Document attachment
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('2 MB')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();

      // Gallery should be present (for images only)
      expect(screen.getByTestId('car-media-gallery')).toBeInTheDocument();

      // Click on document to download
      const documentElement = screen.getByText('document.pdf').closest('div');
      fireEvent.click(documentElement!);

      expect(mockDownload).toHaveBeenCalledWith(
        'https://example.com/document.pdf',
        'document.pdf'
      );

      // Click on image to open gallery
      const image = screen.getByAltText('screenshot.png');
      fireEvent.click(image);

      await waitFor(() => {
        const modal = screen.getByTestId('gallery-modal');
        expect(modal).toHaveTextContent('Image 1 of 1'); // Only 1 image in gallery
      });
    });

    it('should handle conversation flow with multiple messages', () => {
      const mockDownload = jest.fn();

      const messages = [
        createMockMessage({
          id: 1,
          displayContent: 'Hello! Are you still selling the car?',
          isOwn: false,
          createdAt: '2024-01-01T10:00:00Z'
        }),
        createMockMessage({
          id: 2,
          displayContent: 'Yes, it\'s still available. Here are some additional photos:',
          isOwn: true,
          createdAt: '2024-01-01T10:05:00Z',
          attachments: [
            {
              id: 1,
              fileName: 'interior.jpg',
              fileUrl: 'https://example.com/interior.jpg',
              contentType: 'image/jpeg',
              size: 1024000,
              image: true,
              humanReadableSize: '1 MB'
            }
          ]
        }),
        createMockMessage({
          id: 3,
          displayContent: 'Looks great! Can you send me the maintenance records?',
          isOwn: false,
          createdAt: '2024-01-01T10:10:00Z'
        }),
        createMockMessage({
          id: 4,
          displayContent: 'Sure, here they are:',
          isOwn: true,
          createdAt: '2024-01-01T10:15:00Z',
          attachments: [
            {
              id: 2,
              fileName: 'maintenance-records.pdf',
              fileUrl: 'https://example.com/maintenance-records.pdf',
              contentType: 'application/pdf',
              size: 3072000,
              image: false,
              humanReadableSize: '3 MB'
            }
          ]
        })
      ];

      const { container } = render(
        <div>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.isOwn || false}
              isRTL={false}
              onDownloadDocument={mockDownload}
            />
          ))}
        </div>
      );

      // All messages should be displayed
      expect(screen.getByText('Hello! Are you still selling the car?')).toBeInTheDocument();
      expect(screen.getByText('Yes, it\'s still available. Here are some additional photos:')).toBeInTheDocument();
      expect(screen.getByText('Looks great! Can you send me the maintenance records?')).toBeInTheDocument();
      expect(screen.getByText('Sure, here they are:')).toBeInTheDocument();

      // Attachments should be displayed
      expect(screen.getByAltText('interior.jpg')).toBeInTheDocument();
      expect(screen.getByText('maintenance-records.pdf')).toBeInTheDocument();

      // Different message styles should be applied
      const ownMessages = container.querySelectorAll('.bg-gradient-to-r.from-blue-500.to-blue-600');
      const otherMessages = container.querySelectorAll('.bg-gray-100.dark\\:bg-gray-700');
      
      expect(ownMessages.length).toBe(2); // Messages 2 and 4
      expect(otherMessages.length).toBe(2); // Messages 1 and 3

      // Test document download
      const pdfDocument = screen.getByText('maintenance-records.pdf').closest('div');
      fireEvent.click(pdfDocument!);

      expect(mockDownload).toHaveBeenCalledWith(
        'https://example.com/maintenance-records.pdf',
        'maintenance-records.pdf'
      );
    });

    it('should handle loading states during message sending', () => {
      const mockSendMessage = jest.fn();
      const mockSetMessage = jest.fn();
      const mockSetFiles = jest.fn();

      // Test sending state
      render(
        <MessageInput
          newMessage="Sending this message..."
          setNewMessage={mockSetMessage}
          onSendMessage={mockSendMessage}
          selectedFiles={[]}
          setSelectedFiles={mockSetFiles}
          sending={true}
          uploading={false}
          isRTL={false}
          conversationId={1}
          onUploadProgress={jest.fn()}
        />
      );

      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveAttribute('title', 'sending');
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      // Test uploading state
      render(
        <MessageInput
          newMessage="Uploading files..."
          setNewMessage={mockSetMessage}
          onSendMessage={mockSendMessage}
          selectedFiles={[new File(['test'], 'test.jpg', { type: 'image/jpeg' })]}
          setSelectedFiles={mockSetFiles}
          sending={false}
          uploading={true}
          isRTL={false}
          conversationId={1}
          onUploadProgress={jest.fn()}
        />
      );

      const uploadingButton = screen.getByRole('button');
      expect(uploadingButton).toBeDisabled();
      expect(uploadingButton).toHaveAttribute('title', 'sending');
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle image loading errors gracefully', () => {
      const mockDownload = jest.fn();

      const messageWithBrokenImage = createMockMessage({
        attachments: [
          {
            id: 1,
            fileName: 'broken-image.jpg',
            fileUrl: 'https://example.com/broken-image.jpg',
            contentType: 'image/jpeg',
            size: 1024000,
            image: true,
            humanReadableSize: '1 MB'
          }
        ]
      });

      render(
        <MessageBubble
          message={messageWithBrokenImage}
          isOwn={false}
          isRTL={false}
          onDownloadDocument={mockDownload}
        />
      );

      const image = screen.getByAltText('broken-image.jpg');
      
      // Simulate image load error
      fireEvent.error(image);

      // Image should still be present (error handling should set default src)
      expect(image).toBeInTheDocument();
    });

    it('should handle empty or malformed message data', () => {
      const mockDownload = jest.fn();

      const emptyMessage = createMockMessage({
        displayContent: '',
        attachments: []
      });

      render(
        <MessageBubble
          message={emptyMessage}
          isOwn={false}
          isRTL={false}
          onDownloadDocument={mockDownload}
        />
      );

      // Should still render time
      expect(screen.getByText('10:00 AM')).toBeInTheDocument();
      
      // Should not crash or show broken content
      expect(screen.queryByTestId('car-media-gallery')).not.toBeInTheDocument();
    });
  });
});
