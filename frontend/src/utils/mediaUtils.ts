/**
 * Utility functions for handling media and URLs
 */

/**
 * Transforms MinIO URLs to use the correct hostname for browser access
 * Replaces 'autotrader-assets.minio:9000' with the configured MINIO_URL
 * 
 * @param url The original URL from the API
 * @returns The transformed URL that can be resolved by the browser
 */
export function transformMinioUrl(url: string): string {
  if (!url) return '';
  
  // If the URL includes the MinIO hostname that can't be resolved
  if (url.includes('autotrader-assets.minio:9000')) {
    const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
    
    // Replace the problematic hostname with the configured one
    return url.replace('http://autotrader-assets.minio:9000', minioBaseUrl);
  }
  
  return url;
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
