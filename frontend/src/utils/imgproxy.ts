/**
 * Imgproxy URL utilities for optimized image delivery.
 * 
 * Imgproxy is an industry-standard image processing service that provides:
 * - On-the-fly resizing
 * - WebP/AVIF auto-conversion
 * - Blur placeholder generation
 * - High performance caching
 * 
 * @see https://docs.imgproxy.net/
 */

const IMGPROXY_URL = process.env.NEXT_PUBLIC_IMGPROXY_URL || 'http://localhost:8081';
const IMGPROXY_ENABLED = process.env.NEXT_PUBLIC_IMGPROXY_ENABLED !== 'false';

// Preset sizes matching common use cases
export const ImageSizes = {
  ORIGINAL: 1920,
  LARGE: 1200,
  MEDIUM: 800,
  SMALL: 400,
  THUMBNAIL: 200,
  BLUR: 10,
} as const;

export type ImageSize = keyof typeof ImageSizes;

/**
 * Generate an Imgproxy URL for resized images.
 * 
 * @param originalUrl - The original image URL (e.g., from MinIO/S3)
 * @param width - Target width
 * @param height - Target height (0 for auto aspect ratio)
 * @returns Imgproxy URL or original URL if Imgproxy is disabled
 * 
 * @example
 * getResizedImageUrl('/api/files/listings/123/car.jpg', 800, 600)
 * // Returns: http://localhost:8081/insecure/rs:fit:800:600/plain/http://...
 */
export function getResizedImageUrl(
  originalUrl: string,
  width: number,
  height: number = 0
): string {
  if (!IMGPROXY_ENABLED || !originalUrl) {
    return originalUrl;
  }

  // Convert relative URLs to absolute
  const absoluteUrl = toAbsoluteUrl(originalUrl);
  
  // Encode the source URL
  const encodedUrl = Buffer.from(absoluteUrl).toString('base64url');
  
  // Build processing options
  const processingOptions = `rs:fit:${width}:${height}`;
  
  // For development, use insecure mode (no signature)
  return `${IMGPROXY_URL}/insecure/${processingOptions}/${encodedUrl}`;
}

/**
 * Get image URL for a specific preset size.
 * 
 * @param originalUrl - The original image URL
 * @param size - Preset size name
 * @returns Imgproxy URL
 */
export function getPresetImageUrl(originalUrl: string, size: ImageSize): string {
  return getResizedImageUrl(originalUrl, ImageSizes[size], 0);
}

/**
 * Generate a blur placeholder URL (LQIP - Low Quality Image Placeholder).
 * Returns a tiny 10x10 blurred image that can be used as placeholder.
 * 
 * @param originalUrl - The original image URL
 * @returns Imgproxy URL for blur placeholder
 */
export function getBlurPlaceholderUrl(originalUrl: string): string {
  if (!IMGPROXY_ENABLED || !originalUrl) {
    return originalUrl;
  }

  const absoluteUrl = toAbsoluteUrl(originalUrl);
  const encodedUrl = Buffer.from(absoluteUrl).toString('base64url');
  
  // rs:fit:10:10 = resize to 10px, bl:5 = blur, q:50 = low quality
  const processingOptions = 'rs:fit:10:10/bl:5/q:50';
  
  return `${IMGPROXY_URL}/insecure/${processingOptions}/${encodedUrl}`;
}

/**
 * Generate WebP optimized URL.
 * 
 * @param originalUrl - The original image URL
 * @param width - Target width
 * @returns Imgproxy URL with WebP format
 */
export function getWebpUrl(originalUrl: string, width: number): string {
  if (!IMGPROXY_ENABLED || !originalUrl) {
    return originalUrl;
  }

  const absoluteUrl = toAbsoluteUrl(originalUrl);
  const encodedUrl = Buffer.from(absoluteUrl).toString('base64url');
  
  const processingOptions = `rs:fit:${width}:0/f:webp`;
  
  return `${IMGPROXY_URL}/insecure/${processingOptions}/${encodedUrl}`;
}

/**
 * Generate srcset for responsive images.
 * 
 * @param originalUrl - The original image URL
 * @param widths - Array of widths for srcset
 * @returns srcset string for use with <img> or Next.js Image
 */
export function generateSrcSet(
  originalUrl: string,
  widths: number[] = [400, 800, 1200, 1920]
): string {
  if (!IMGPROXY_ENABLED) {
    return '';
  }

  return widths
    .map(w => `${getResizedImageUrl(originalUrl, w)} ${w}w`)
    .join(', ');
}

/**
 * Convert relative URL to absolute URL.
 */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For API URLs, prepend the API base URL
  if (url.startsWith('/api/')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return `${apiBaseUrl}${url}`;
  }
  
  // For S3 URLs (s3://bucket/key format)
  if (url.startsWith('s3://')) {
    return url;
  }
  
  // Default: assume it's a relative path
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000';
  return `${baseUrl}${url}`;
}

/**
 * Check if Imgproxy is enabled.
 */
export function isImgproxyEnabled(): boolean {
  return IMGPROXY_ENABLED;
}

/**
 * Helper to create responsive image props for Next.js Image component.
 * 
 * @param originalUrl - The original image URL
 * @returns Object with loader and blurDataURL
 * 
 * @example
 * <Image 
 *   src={imageUrl}
 *   {...getOptimizedImageProps(imageUrl)}
 * />
 */
export function getOptimizedImageProps(originalUrl: string) {
  if (!IMGPROXY_ENABLED) {
    return {};
  }

  return {
    loader: ({ src, width }: { src: string; width: number }) => 
      getResizedImageUrl(src, width),
    blurDataURL: getBlurPlaceholderUrl(originalUrl),
    placeholder: 'blur' as const,
  };
}
