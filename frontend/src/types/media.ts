/**
 * Media-related type definitions for the Caryo Marketplace
 */

export interface MediaItem {
  url: string;
  isPrimary?: boolean;
  type?: string;
  contentType?: string;
  isVideo?: boolean;
}

export interface HoverImageNavigationProps {
  media?: MediaItem[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onVideoPlayingChange?: (playing: boolean) => void;
}

export interface CarMediaItem {
  url: string;
  isPrimary?: boolean;
  type?: 'image' | 'video';
  contentType?: string;
}
