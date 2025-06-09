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
