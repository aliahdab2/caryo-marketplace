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
 * Processes an array of image URLs, ensuring they're all valid and transforming any MinIO URLs
 * 
 * @param urls Array of image URLs to process
 * @returns Array of transformed and validated URLs
 */
export function processImageUrls(urls: string[]): string[] {
  if (!urls || !Array.isArray(urls)) return [];
  
  return urls
    .filter(url => url && typeof url === 'string')
    .map(transformMinioUrl);
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

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
}

export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return yt ? `https://www.youtube.com/embed/${yt[1]}` : null;
}

export function validateImageFile(file: File): { valid: boolean; errorKey?: string } {
  if (!file || !file.type?.startsWith('image/')) {
    return { valid: false, errorKey: 'newListingValidationNotImage' };
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return { valid: false, errorKey: 'newListingValidationFileTooLarge' };
  }
  return { valid: true };
}

export function validateVideoFile(file: File): { valid: boolean; errorKey?: string } {
  if (!file || !file.type?.startsWith('video/')) {
    return { valid: false, errorKey: 'invalidVideoFormat' };
  }
  const maxBytes = 100 * 1024 * 1024; // 100MB
  if (file.size > maxBytes) {
    return { valid: false, errorKey: 'videoTooLarge' };
  }
  return { valid: true };
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
