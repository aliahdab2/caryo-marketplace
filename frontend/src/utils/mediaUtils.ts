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
  if (!url) return '';
  
  // For debugging
  console.log('Original URL:', url);
  
  // Replace Docker hostname with localhost
  let transformedUrl = url;
  if (url.includes('minio:9000')) {
    transformedUrl = url.replace('minio:9000', 'localhost:9000');
    console.log('Transformed URL:', transformedUrl);
  }
  
  return transformedUrl;
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
