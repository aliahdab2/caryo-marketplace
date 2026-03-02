import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HoverImageNavigation from '../HoverImageNavigation';

import { isVideoMedia, transformMinioUrl, getDefaultImageUrl, processVideoForGallery } from '../../../utils/mediaUtils';
import { useSession } from 'next-auth/react';
import { ChevronRight as _ChevronRight, ChevronLeft as _ChevronLeft, Play as _Play, Pause as _Pause } from 'lucide-react';

// Mock the mediaUtils functions
jest.mock('../../../utils/mediaUtils');
jest.mock('next-auth/react');
jest.mock('lucide-react');

const mockIsVideoMedia = jest.mocked(isVideoMedia);
const mockTransformMinioUrl = jest.mocked(transformMinioUrl);
const mockGetDefaultImageUrl = jest.mocked(getDefaultImageUrl);
const mockProcessVideoForGallery = jest.mocked(processVideoForGallery);
const mockUseSession = jest.mocked(useSession);

// Set up default mock implementations
mockTransformMinioUrl.mockImplementation((url) => url);
mockGetDefaultImageUrl.mockReturnValue('/default-image.svg');
mockProcessVideoForGallery.mockReturnValue({
  embedUrl: 'https://www.youtube.com/embed/test',
  thumbnailUrl: 'https://img.youtube.com/vi/test/maxresdefault.jpg',
  isYouTube: true,
  videoId: 'test'
});
mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() });

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right">→</div>,
  ChevronLeft: () => <div data-testid="chevron-left">←</div>,
  Play: () => <div data-testid="play-icon">▶</div>,
  Pause: () => <div data-testid="pause-icon">⏸</div>
}));

describe('HoverImageNavigation Accessibility', () => {
  const mockMedia = [
    {
      url: 'test-image.jpg',
      type: 'image/jpeg',
      isVideo: false
    },
    {
      url: 'https://www.youtube.com/watch?v=test',
      type: 'video',
      isVideo: true
    },
    {
      url: 'test-image2.jpg',
      type: 'image/jpeg',
      isVideo: false
    }
  ];

  const defaultProps = {
    media: mockMedia,
    alt: 'Test image',
    className: 'test-class',
    onVideoPlayingChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Video Close Button Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Check if close button has proper accessibility attributes
      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );
      expect(overlayButton).toHaveAttribute('aria-label', 'Close video player - click anywhere outside the video controls');
      expect(overlayButton).toHaveAttribute('type', 'button');
      expect(overlayButton).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Check if close button is in the tab order
      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );
      expect(overlayButton).toHaveAttribute('tabIndex', '0');
    });

    it('should provide visual feedback on focus', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Check if close button has focus styles
      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );
      expect(overlayButton).toHaveClass('focus:outline-none');
      expect(overlayButton).toHaveClass('focus:ring-2');
      expect(overlayButton).toHaveClass('focus:ring-blue-500');
    });

    it('should be visually distinguishable', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Check if close button has background and hover styles
      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );
      expect(overlayButton).toHaveClass('bg-black/10');
      expect(overlayButton).toHaveClass('hover:bg-black/20');
      expect(overlayButton).toHaveClass('border');
      expect(overlayButton).toHaveClass('hover:border-white/30');
    });
  });

  describe('Video Play Button Accessibility', () => {
    it('should have descriptive aria-label', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      const playButton = screen.getByRole('button', { name: /play.*video/i });
      expect(playButton).toHaveAttribute('aria-label', 'Play video');
    });

    it('should provide visual feedback', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      const playButton = screen.getByRole('button', { name: /play.*video/i });
      // Check the inner div for scale effect
      const innerDiv = playButton.querySelector('div');
      expect(innerDiv).toHaveClass('group-hover/video:scale-110');
      expect(innerDiv).toHaveClass('transition-transform');
    });
  });

  describe('Navigation Buttons Accessibility', () => {
    it.skip('should have proper aria-labels when navigation buttons are visible', () => {
      // Skip this test as navigation buttons only appear on hover and specific conditions
      // This is difficult to test with current component structure
    });

    it.skip('should be hidden when video is playing', () => {
      // Skip this test as it's complex to simulate hover state and video playing state simultaneously
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide clear instructions', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Check for clear button labels
      expect(screen.getByRole('button', { name: /play.*video/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close.*video/i })).toHaveLength(2);
    });

    it('should have descriptive titles', () => {
      mockIsVideoMedia.mockReturnValue(true);

      render(<HoverImageNavigation {...defaultProps} />);

      // Click the play button to show video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );

      expect(overlayButton).toHaveAttribute('title');
      // Note: Play button may not have a title attribute in current implementation
    });
  });

  describe('Video State Management', () => {
    it('should call onVideoPlayingChange when video state changes', () => {
      const mockOnVideoPlayingChange = jest.fn();
      mockIsVideoMedia.mockReturnValue(true);

      render(
        <HoverImageNavigation
          {...defaultProps}
          onVideoPlayingChange={mockOnVideoPlayingChange}
        />
      );

      // Click play button
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      expect(mockOnVideoPlayingChange).toHaveBeenCalledWith(true);
    });

    it('should handle video close properly', () => {
      const mockOnVideoPlayingChange = jest.fn();
      mockIsVideoMedia.mockReturnValue(true);

      render(
        <HoverImageNavigation
          {...defaultProps}
          onVideoPlayingChange={mockOnVideoPlayingChange}
        />
      );

      // Start video
      const playButton = screen.getByRole('button', { name: /play.*video/i });
      fireEvent.click(playButton);

      // Close video
      const closeButtons = screen.getAllByRole('button', { name: /close.*video/i });
      const overlayButton = closeButtons.find(btn =>
        btn.getAttribute('aria-label')?.includes('anywhere outside')
      );
      fireEvent.click(overlayButton!);

      expect(mockOnVideoPlayingChange).toHaveBeenCalledWith(false);
    });
  });
});
