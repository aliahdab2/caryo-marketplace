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
  
  // Skip transformation if it's not a string or not a MinIO URL pattern
  if (typeof url !== 'string' || (!url.includes('minio:') && !url.includes('localhost:9000'))) {
    return url;
  }
  
  try {
    // Replace Docker hostname with localhost
    if (url.includes('minio:9000')) {
      return url.replace('minio:9000', 'localhost:9000');
    }
    
    // Support additional transformations if needed in the future
    // For example: handle different environments or URL formats
    
    return url;
  } catch {
    // In case of any errors, return the original URL
    // No logging here to avoid excessive console output
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

/**
 * Checks if a URL is likely an uploaded video file based on file extension
 */
export function isUploadedVideoFile(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.m4v', '.3gp'];
  const lowerUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * Gets the appropriate MIME type for a video URL
 */
export function getVideoMimeType(url: string): string {
  if (!url || typeof url !== 'string') return 'video/mp4';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('.webm')) return 'video/webm';
  if (lowerUrl.includes('.mov') || lowerUrl.includes('.quicktime')) return 'video/quicktime';
  if (lowerUrl.includes('.avi')) return 'video/x-msvideo';
  if (lowerUrl.includes('.wmv')) return 'video/x-ms-wmv';
  if (lowerUrl.includes('.flv')) return 'video/x-flv';
  if (lowerUrl.includes('.mkv')) return 'video/x-matroska';
  if (lowerUrl.includes('.3gp')) return 'video/3gpp';
  
  // Default to MP4
  return 'video/mp4';
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
