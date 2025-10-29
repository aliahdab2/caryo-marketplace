import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarMediaGallery from '../CarMediaGallery';
import { CarMedia } from '../types';

// Mock i18next for translations
jest.mock('react-i18next', () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string, options?: { current?: number; total?: number }) => {
      if (namespace === 'mediaGallery') {
        const translations: { [key: string]: string } = {
          'mediaCount': options ? `${options.current} of ${options.total}` : 'N of N'
        };
        return translations[key] || key;
      }
      return key;
    },
  }),
}));

// Mock language direction hook
jest.mock('@/utils/languageDirection', () => ({
  useLanguageDirection: () => ({ isRTL: false }),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  // Mock component has to use an img element, which is ok for tests
  return function MockNextImage({
    _src,
    alt,
    width,
    height,
    className,
    ..._props
  }: {
    _src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    [key: string]: unknown;
  }) {
    return (
      <div
        data-testid="next-image-container"
        className={className}
        style={{
          position: 'relative',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          background: 'lightgray',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'gray',
          }}
        >
          {alt || 'Image'}
        </span>
      </div>
    );
  };
});

// Mock keen-slider hooks
jest.mock('keen-slider/react', () => ({
  useKeenSlider: (config?: { created?: (instance: unknown) => void }) => {
    const mockSliderRef = jest.fn();
    const mockInstanceRef = {
      current: {
        next: jest.fn(),
        prev: jest.fn(),
        moveToIdx: jest.fn(),
        track: { details: { rel: 0 } },
      },
    };

    // Simulate the created callback being called
    if (config && config.created) {
      setTimeout(() => config.created && config.created(mockInstanceRef.current), 0);
    }

    return [
      mockSliderRef, // ref callback
      mockInstanceRef, // instanceRef
    ] as const;
  },
}));

// Mock headlessui Dialog
jest.mock('@headlessui/react', () => {
  const DialogComponent = ({
    open,
    children,
    className,
    onClose,
  }: {
    open: boolean;
    children: React.ReactNode;
    className?: string;
    onClose?: () => void;
  }) => {
    if (!open) {
      return null;
    }
    return (
      <div className={className} data-testid="modal-dialog" role="dialog" aria-modal="true">
        <button onClick={() => onClose && onClose()}>Close Modal</button>
        {children}
      </div>
    );
  };

  DialogComponent.Overlay = function DialogOverlay(props: React.HTMLAttributes<HTMLDivElement>) {
    return <div data-testid="dialog-overlay" {...props} />;
  };

  const Transition = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Transition.Child = function TransitionChild({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };

  return {
    Dialog: DialogComponent,
    Transition: Transition,
  };
});

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  X: function X() { return <div data-testid="close-icon" />; },
  ChevronLeft: function ChevronLeft() { return <div data-testid="prev-icon" />; },
  ChevronRight: function ChevronRight() { return <div data-testid="next-icon" />; },
  Play: function Play() { return <div data-testid="play-icon" />; },
  Camera: function Camera() { return <div data-testid="camera-icon" />; },
  Video: function Video() { return <div data-testid="video-icon" />; },
}));

describe('CarMediaGallery', () => {
  const sampleMedia: CarMedia[] = [
    {
      type: 'image',
      url: '/images/car-1.jpg',
      alt: 'Car front view',
    },
    {
      type: 'image',
      url: '/images/car-2.jpg',
      alt: 'Car interior',
    },
    {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=abc123',
      thumbnailUrl: '/images/video-thumbnail.jpg',
      alt: 'Car video tour',
    },
  ];

  it('renders correctly with images and video', () => {
    render(<CarMediaGallery media={sampleMedia} />);

    // Should display the main gallery container and thumbnails
    const frontViewImages = screen.getAllByText('Car front view');
    expect(frontViewImages.length).toBeGreaterThan(0); // Both main view and thumbnail

    // Should show play icon on video thumbnail
    const playIcons = screen.getAllByTestId('play-icon');
    expect(playIcons.length).toBeGreaterThan(0);

    // Should render all media items (both in main view and thumbnails)
    expect(screen.getAllByText('Car front view').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Car interior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Car video tour').length).toBeGreaterThan(0);

    // Should show the main gallery area (no longer has "View gallery" button)
    const mainGalleryArea = screen.getByText('1 of 3').closest('div');
    expect(mainGalleryArea).toBeInTheDocument();
  });

  it('handles empty media array gracefully', () => {
    render(<CarMediaGallery media={[]} />);
    expect(screen.getByText('No media available')).toBeInTheDocument();
  });

  it('shows position indicators for navigation', () => {
    render(<CarMediaGallery media={sampleMedia} />);

    // Check that the gallery container exists
    expect(screen.getAllByText('Car front view').length).toBeGreaterThan(0);

    // Should show navigation arrows (since we have multiple media items)
    expect(screen.getByLabelText('Previous media')).toBeInTheDocument();
    expect(screen.getByLabelText('Next media')).toBeInTheDocument();

    // Should show media counter (1 of 3 format)
    expect(screen.getByText('1 of 3')).toBeInTheDocument();

    // Verify all media items are rendered in thumbnails
    expect(screen.getAllByText('Car interior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Car video tour').length).toBeGreaterThan(0);
  });

  it('respects initialIndex prop', () => {
    render(<CarMediaGallery media={sampleMedia} initialIndex={1} />);

    // Verify the component renders with the media
    expect(screen.getAllByText('Car front view').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Car interior').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Car video tour').length).toBeGreaterThan(0);

    // Should show media counter starting at index 1 (which is 2 of 3)
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('navigates between images using navigation arrows', () => {
    render(<CarMediaGallery media={sampleMedia} />);

    // Verify initial state shows first media item
    expect(screen.getByText('1 of 3')).toBeInTheDocument();

    // Click next arrow
    const nextButton = screen.getByLabelText('Next media');
    fireEvent.click(nextButton);

    // Should advance to next media item (2 of 3)
    expect(screen.getByText('2 of 3')).toBeInTheDocument();

    // Click previous arrow
    const prevButton = screen.getByLabelText('Previous media');
    fireEvent.click(prevButton);

    // Should go back to first media item (1 of 3)
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('opens the modal when clicking on the main image', () => {
    render(<CarMediaGallery media={sampleMedia} />);

    // Click on the main gallery area to open modal
    const mainViews = screen.getAllByText('Car front view');
    const mainView = mainViews[0].closest('div[class*="cursor-pointer"]'); // Get the first one (main view)
    fireEvent.click(mainView as HTMLElement);

    // Verify the modal is open
    const modal = screen.getByTestId('modal-dialog');
    expect(modal).toBeInTheDocument();

    // Close the modal
    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);
  });

  it('displays photo counter when there are multiple media items', async () => {
    render(<CarMediaGallery media={sampleMedia} />);

    // Should show the media counter in new format (1 of 3)
    const photoCounter = await screen.findByText('1 of 3');
    expect(photoCounter).toBeInTheDocument();
  });

  it('displays single image correctly', () => {
    const singleMedia: CarMedia[] = [
      {
        type: 'image',
        url: 'https://picsum.photos/800/600?random=1',
        alt: 'Single car image',
        width: 800,
        height: 600
      }
    ];

    render(<CarMediaGallery media={singleMedia} />);

    // Single items don't show position indicators (clean interface)
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();

    // Should show the main gallery area
    const mainGalleryArea = screen.getByText('Single car image').closest('div');
    expect(mainGalleryArea).toBeInTheDocument();

    // Should not show navigation arrows for single item
    expect(screen.queryByLabelText('Next media')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Previous media')).not.toBeInTheDocument();
  });
});
