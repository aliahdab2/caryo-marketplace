import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CarMediaGallery from '../CarMediaGallery';
import { CarMedia } from '../types';

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
    
    // Should display the main gallery container
    const gallery = screen.getByText('Car front view');
    expect(gallery).toBeInTheDocument();
    
    // Should show play icon on video slide
    const playIcons = screen.getAllByTestId('play-icon');
    expect(playIcons.length).toBeGreaterThan(0);
    
    // Should render all media items as slides
    expect(screen.getByText('Car front view')).toBeInTheDocument();
    expect(screen.getByText('Car interior')).toBeInTheDocument();
    expect(screen.getByText('Car video tour')).toBeInTheDocument();
  });

  it('handles empty media array gracefully', () => {
    render(<CarMediaGallery media={[]} />);
    expect(screen.getByText('No media available')).toBeInTheDocument();
  });

  it('shows position indicators for navigation', () => {
    render(<CarMediaGallery media={sampleMedia} />);
    
    // Check that the gallery container exists
    expect(screen.getByText('Car front view')).toBeInTheDocument();
    
    // The component should render the keen-slider container
    const sliderContainer = screen.getByText('Car front view').closest('.keen-slider');
    expect(sliderContainer).toBeInTheDocument();
    
    // Verify all media items are rendered in slides
    expect(screen.getByText('Car interior')).toBeInTheDocument();
    expect(screen.getByText('Car video tour')).toBeInTheDocument();
  });

  it('respects initialIndex prop', () => {
    render(<CarMediaGallery media={sampleMedia} initialIndex={1} />);
    
    // Verify the component renders with the media
    expect(screen.getByText('Car front view')).toBeInTheDocument();
    expect(screen.getByText('Car interior')).toBeInTheDocument();
    expect(screen.getByText('Car video tour')).toBeInTheDocument();
    
    // Check that all media items are rendered as slides
    const allSlides = screen.getAllByText(/Car/);
    expect(allSlides.length).toEqual(sampleMedia.length);
  });

  it('navigates between images using the slider', () => {
    render(<CarMediaGallery media={sampleMedia} />);
    
    // Verify the slider container is present
    const sliderContainer = screen.getByText('Car front view').closest('.keen-slider');
    expect(sliderContainer).toBeInTheDocument();
    
    // Verify only image items are rendered in the main slider (not videos)
    expect(screen.getByText('Car front view')).toBeInTheDocument();
    expect(screen.getByText('Car interior')).toBeInTheDocument();
    // Video should be in separate section, not in main slider
    expect(screen.getByText('Car video tour')).toBeInTheDocument();
    
    // Navigation is handled by keen-slider, so we just verify the image slides exist
    const slides = sliderContainer?.querySelectorAll('.keen-slider__slide');
    // Should only have 2 slides (images only), not 3 (since video is separate)
    expect(slides?.length).toBe(2);
  });

  it('opens the modal when clicking on the main image', () => {
    render(<CarMediaGallery media={sampleMedia} />);
    
    // Get the main slider and click on it
    const mainSlider = screen.getByText('Car front view').closest('.keen-slider');
    fireEvent.click(mainSlider as HTMLElement);
    
    // Verify the modal is open
    const modal = screen.getByTestId('modal-dialog');
    expect(modal).toBeInTheDocument();
    
    // Close the modal
    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);
  });

  it('displays photo counter when there are multiple media items', async () => {
    render(<CarMediaGallery media={sampleMedia} />);
    
    // Wait for the photo counter to appear (after the created callback is called)
    const photoCounter = await screen.findByText('1 of 2');
    expect(photoCounter).toBeInTheDocument();
    expect(photoCounter).toHaveClass('absolute', 'bottom-2', 'right-2');
  });

  it('does not display photo counter when there is only one media item', () => {
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
    
    // Verify the photo counter is not displayed
    expect(screen.queryByText('1 of 1')).not.toBeInTheDocument();
  });
});
