/**
 * Utility functions for handling media and URLs
 */

/**
 * Transforms internal Docker MinIO URLs to browser-accessible URLs
 * 
 * @param url The URL from the API
 * @returns The corrected URL that can be accessed by the browser
 */
export function transformMinioUrl(url: string): string {
  // Handle empty, undefined, or already processed URLs
  if (!url) return '';

  if (typeof url !== 'string') return url;

  // If it's a bare storage key (no protocol/host), build a dev URL to MinIO
  const looksLikeStorageKey = !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/');
  if (looksLikeStorageKey) {
    // Assume default bucket path exposed at localhost:9000
    return `http://localhost:9000/autotrader-assets/${url}`;
  }

  // Skip transformation if it's not a MinIO docker hostname
  if (!url.includes('minio:9000')) {
    return url;
  }

  try {
    // Replace Docker hostname with localhost
    if (url.includes('minio:9000')) {
      return url.replace('minio:9000', 'localhost:9000');
    }
    return url;
  } catch {
    return url;
  }
}



/**
 * Gets a fallback image URL if the primary image is not available
 * 
 * @returns Default image URL
 */
export function getDefaultImageUrl(): string {
  return '/images/vehicles/car-default.svg';
}

/** Media helpers (validation and providers) */
import type { VideoUrlInput } from '@/types/listings';

// Compiled regex for better performance
const YOUTUBE_URL_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;

export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return YOUTUBE_URL_REGEX.test(url);
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export function getYouTubeThumbnailUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` : null;
}

/**
 * Enhanced video processing for CarMediaGallery
 * Handles both thumbnail generation and embed URL creation
 */
// Type for video processing result
export interface VideoProcessingResult {
  thumbnailUrl: string | null;
  embedUrl: string | null;
  isYouTube: boolean;
  videoId?: string;
}

export function processVideoForGallery(url: string): VideoProcessingResult {
  if (!url || typeof url !== 'string') {
    return { thumbnailUrl: null, embedUrl: null, isYouTube: false };
  }

  const match = url.match(YOUTUBE_URL_REGEX);
  const isYT = Boolean(match);
  const videoId = match?.[1];
  
  return {
    thumbnailUrl: isYT && videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null,
    embedUrl: isYT && videoId ? `https://www.youtube.com/embed/${videoId}` : null,
    isYouTube: isYT,
    videoId
  };
}





export function normalizeVideoUrls(urls: Array<VideoUrlInput | string>): VideoUrlInput[] {
  if (!Array.isArray(urls)) return [];
  const first = urls[0];
  const url = typeof first === 'string' ? first : first?.url || '';
  const normalized: VideoUrlInput = {
    url,
    isValidated: isYouTubeUrl(url)
  };
  return url ? [normalized] : [];
}
