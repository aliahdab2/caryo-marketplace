/**
 * Types for the CarMediaGallery component
 * 
 * Defines the structure for a Blocket-inspired media gallery
 * that supports images and videos with Next.js optimization.
 */

/**
 * Represents a single media item (image or video) in the car gallery
 */
export type CarMedia = {
  /** Type of media - either 'image' or 'video' */
  type: 'image' | 'video';
  
  /** URL of the media (image source or video URL) */
  url: string;
  
  /** 
   * Thumbnail URL for video preview
   * Required for videos, ignored for images 
   */
  thumbnailUrl?: string;
  
  /** 
   * Alt text for accessibility
   * Describes the image or video content - required for a11y
   */
  alt: string;
  
  /**
   * Optional width for aspect ratio maintenance
   * Used with next/image for proper sizing
   */
  width?: number;
  
  /**
   * Optional height for aspect ratio maintenance
   * Used with next/image for proper sizing
   */
  height?: number;
};

export interface CarMediaGalleryProps {
  /** Array of media items (images and videos) to display */
  media: CarMedia[];
  
  /** Index of the media item to show initially (default: 0) */
  initialIndex?: number;
  
  /** Enable swipe gestures on touch devices (default: true) */
  enableSwipe?: boolean;
  
  /** Additional CSS class for custom styling */
  className?: string;
}

/**
 * Props for the CarMediaModal component
 */
export interface CarMediaModalProps {
  /** Array of media items to display in the modal */
  media: CarMedia[];
  
  /** Index of the currently selected media item */
  currentIndex: number;
  
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Function to call when the modal should close */
  onClose: () => void;
  
  /** Function to call when changing to a different media item */
  onChangeIndex: (index: number) => void;
}

/**
 * Props for the media thumbnail component
 */
export interface MediaThumbnailProps {
  /** The media item to display as a thumbnail */
  media: CarMedia;
  
  /** Whether this thumbnail is currently selected */
  isSelected: boolean;
  
  /** Function to call when this thumbnail is clicked */
  onClick: () => void;
}
