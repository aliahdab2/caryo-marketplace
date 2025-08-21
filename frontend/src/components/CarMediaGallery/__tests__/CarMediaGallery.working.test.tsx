import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarMediaGallery from '../CarMediaGallery';
import { CarMedia } from '../types';

// Mock i18next for translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { current?: number; total?: number }) => {
      if (key === 'mediaCount' && options) {
        return `${options.current} of ${options.total}`;
      }
      const translations: { [key: string]: string } = {
        'viewGallery': 'View gallery',
        'viewImage': 'View image',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock language direction hook
jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({ isRTL: false }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockNextImage({ alt, ...props }: { alt: string; [key: string]: unknown }) {
    return <div role="img" aria-label={alt} data-testid="mock-image" {...props} />;
  };
});

// Mock headlessui Dialog
jest.mock('@headlessui/react', () => ({
  Dialog: ({ open, children, onClose }: { 
    open: boolean; 
    children: React.ReactNode; 
    onClose: () => void;
  }) => {
    return open ? (
      <div data-testid="modal" role="dialog">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        {children}
      </div>
    ) : null;
  },
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  ChevronRight: () => <div data-testid="chevron-right" />,
  Play: () => <div data-testid="play-icon" />,
  Camera: () => <div data-testid="camera-icon" />,
  Video: () => <div data-testid="video-icon" />,
}));

describe('CarMediaGallery - Working Tests', () => {
  const sampleImages: CarMedia[] = [
    {
      type: 'image',
      url: '/img1.jpg',
      alt: 'First car image',
    },
    {
      type: 'image',
      url: '/img2.jpg',
      alt: 'Second car image',
    },
    {
      type: 'image',
      url: '/img3.jpg',
      alt: 'Third car image',
    },
  ];

  const sampleVideos: CarMedia[] = [
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=abc123',
      thumbnailUrl: '/thumb1.jpg',
      alt: 'First car video',
    },
    {
      type: 'video',
      url: 'https://youtu.be/def456',
      thumbnailUrl: '/thumb2.jpg',
      alt: 'Second car video',
    },
  ];

  const mixedMedia: CarMedia[] = [
    sampleImages[0],
    sampleVideos[0],
    sampleImages[1],
  ];

  describe('Basic Rendering', () => {
    it('renders with multiple images', () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      expect(screen.getByText('View gallery')).toBeInTheDocument();
      expect(screen.getByLabelText('Next media')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous media')).toBeInTheDocument();
    });

    it('renders with single image', () => {
      render(<CarMediaGallery media={[sampleImages[0]]} />);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
      expect(screen.getByText('View image')).toBeInTheDocument();
      expect(screen.queryByLabelText('Next media')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous media')).not.toBeInTheDocument();
    });

    it('handles empty media array', () => {
      render(<CarMediaGallery media={[]} />);
      
      expect(screen.getByText('No media available')).toBeInTheDocument();
    });

    it('respects initialIndex prop', () => {
      render(<CarMediaGallery media={sampleImages} initialIndex={1} />);
      
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates forward with next button', () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      
      const nextButton = screen.getByLabelText('Next media');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('navigates backward with previous button', () => {
      render(<CarMediaGallery media={sampleImages} initialIndex={1} />);
      
      expect(screen.getByText('2/3')).toBeInTheDocument();
      
      const prevButton = screen.getByLabelText('Previous media');
      fireEvent.click(prevButton);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('wraps around from last to first', () => {
      render(<CarMediaGallery media={sampleImages} initialIndex={2} />);
      
      expect(screen.getByText('3/3')).toBeInTheDocument();
      
      const nextButton = screen.getByLabelText('Next media');
      fireEvent.click(nextButton);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('wraps around from first to last', () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      
      const prevButton = screen.getByLabelText('Previous media');
      fireEvent.click(prevButton);
      
      expect(screen.getByText('3/3')).toBeInTheDocument();
    });
  });

  describe('Modal Functionality', () => {
    it('opens modal when clicking main image area', async () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      // Click on the main gallery area (use a more specific selector)
      const galleryButton = screen.getByText('View gallery');
      fireEvent.click(galleryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('closes modal with close button', async () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      // Open modal
      const galleryButton = screen.getByText('View gallery');
      fireEvent.click(galleryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('closes modal with Escape key', async () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      // Open modal
      const galleryButton = screen.getByText('View gallery');
      fireEvent.click(galleryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Close with Escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Video Support', () => {
    it('displays video thumbnails with play icons', () => {
      render(<CarMediaGallery media={sampleVideos} />);
      
      // Should show play icons for videos
      const playIcons = screen.getAllByTestId('play-icon');
      expect(playIcons.length).toBeGreaterThan(0);
      
      // Should show video count
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('shows video type indicator', () => {
      render(<CarMediaGallery media={sampleVideos} />);
      
      // Should show video icon in media count (there may be multiple)
      expect(screen.getAllByTestId('video-icon').length).toBeGreaterThan(0);
    });

    it('handles mixed media types', () => {
      render(<CarMediaGallery media={mixedMedia} />);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      
      // Should show both camera and video icons (there may be multiple)
      expect(screen.getAllByTestId('camera-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('video-icon').length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys in modal', async () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      // Open modal
      const galleryButton = screen.getByText('View gallery');
      fireEvent.click(galleryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Navigate with right arrow
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('2 of 3')).toBeInTheDocument();
      });
      
      // Navigate with left arrow
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(screen.getByText('1 of 3')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles undefined media gracefully', () => {
      // @ts-expect-error Testing error case
      render(<CarMediaGallery media={undefined} />);
      
      expect(screen.getByText('No media available')).toBeInTheDocument();
    });

    it('handles null media gracefully', () => {
      // @ts-expect-error Testing error case
      render(<CarMediaGallery media={null} />);
      
      expect(screen.getByText('No media available')).toBeInTheDocument();
    });

    it('handles media with empty URLs', () => {
      const invalidMedia: CarMedia[] = [
        {
          type: 'image',
          url: '',
          alt: 'Empty URL image',
        },
      ];
      
      render(<CarMediaGallery media={invalidMedia} />);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });

    it('handles media without alt text', () => {
      const mediaWithoutAlt: CarMedia[] = [
        {
          type: 'image',
          url: '/test.jpg',
          alt: '',
        },
      ];
      
      render(<CarMediaGallery media={mediaWithoutAlt} />);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for navigation', () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      expect(screen.getByLabelText('Previous media')).toBeInTheDocument();
      expect(screen.getByLabelText('Next media')).toBeInTheDocument();
    });

    it('has proper modal accessibility attributes', async () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      // Open modal
      const galleryButton = screen.getByText('View gallery');
      fireEvent.click(galleryButton);
      
      await waitFor(() => {
        const modal = screen.getByTestId('modal');
        expect(modal).toHaveAttribute('role', 'dialog');
      });
    });
  });

  describe('Performance', () => {
    it('handles large media arrays without issues', () => {
      const largeMediaArray: CarMedia[] = Array.from({ length: 50 }, (_, i) => ({
        type: 'image',
        url: `/img${i}.jpg`,
        alt: `Image ${i + 1}`,
      }));
      
      render(<CarMediaGallery media={largeMediaArray} />);
      
      expect(screen.getByText('1/50')).toBeInTheDocument();
      expect(screen.getByText('View gallery')).toBeInTheDocument();
    });

    it('handles rapid navigation without breaking', () => {
      render(<CarMediaGallery media={sampleImages} />);
      
      const nextButton = screen.getByLabelText('Next media');
      
      // Rapid clicking should not break the component
      for (let i = 0; i < 10; i++) {
        fireEvent.click(nextButton);
      }
      
      // Should still be functional
      expect(screen.getByText(/[1-3]\/3/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long alt text', () => {
      const longAltMedia: CarMedia[] = [
        {
          type: 'image',
          url: '/test.jpg',
          alt: 'This is a very long alt text that should be handled gracefully by the component without breaking the layout or functionality of the media gallery',
        },
      ];
      
      render(<CarMediaGallery media={longAltMedia} />);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });

    it('handles special characters in URLs', () => {
      const specialCharMedia: CarMedia[] = [
        {
          type: 'image',
          url: '/test-image_with%20special&chars.jpg',
          alt: 'Special chars image',
        },
      ];
      
      render(<CarMediaGallery media={specialCharMedia} />);
      
      expect(screen.getByText('1/1')).toBeInTheDocument();
    });
  });
});
