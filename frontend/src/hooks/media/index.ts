/**
 * Media Management Hooks
 * 
 * This module provides specialized hooks for handling media uploads
 * including images and videos with comprehensive validation, drag & drop,
 * preview generation, and memory management.
 * 
 * Usage Examples:
 * 
 * // Image upload with drag & drop and reordering
 * const imageUpload = useImageUpload({
 *   config: {
 *     maxFiles: 10,
 *     maxFileSize: 5 * 1024 * 1024, // 5MB
 *     enableReordering: true,
 *     enableDragDrop: true
 *   },
 *   onImagesChange: (images, urls) => console.log('Images changed:', images.length),
 *   onError: (error) => console.error('Upload error:', error)
 * });
 * 
 * // Video handling with file upload and URL input
 * const videoHandling = useVideoHandling({
 *   config: {
 *     maxFiles: 1,
 *     maxFileSize: 100 * 1024 * 1024, // 100MB
 *     maxDuration: 180, // 3 minutes
 *     enableUpload: true,
 *     enableUrlInput: true
 *   },
 *   onVideosChange: (videos, urls) => console.log('Videos changed:', videos.length),
 *   onError: (error) => console.error('Video error:', error)
 * });
 */

// Image upload hook
export { useImageUpload } from './useImageUpload';
export type {
  ImageUploadConfig,
  ImageFile,
  UseImageUploadProps,
  UseImageUploadReturn
} from './useImageUpload';

// Video handling hook
export { useVideoHandling } from './useVideoHandling';
export type {
  VideoUploadConfig,
  VideoFile,
  UseVideoHandlingProps,
  UseVideoHandlingReturn
} from './useVideoHandling';

// Combined media hook (if needed in the future)
// export { useMediaManager } from './useMediaManager';
