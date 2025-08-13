import { useState, useCallback, useRef, useEffect } from 'react';
import { createLogger } from '@/utils/logger';

export interface ImageUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  enableReordering?: boolean;
  enableDragDrop?: boolean;
  generatePreviews?: boolean;
  debugEnabled?: boolean;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  id: string;
}

export interface UseImageUploadProps {
  initialImages?: File[];
  initialImageUrls?: string[];
  config?: ImageUploadConfig;
  onImagesChange?: (images: File[], imageUrls: string[]) => void;
  onError?: (error: string) => void;
}

export interface UseImageUploadReturn {
  // State
  images: File[];
  imagePreviewUrls: string[];
  existingImageUrls: string[];
  isDragOver: boolean;
  draggedImageIndex: number | null;
  dragOverImageIndex: number | null;
  isUploading: boolean;
  uploadProgress: number;

  // File Operations
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addFiles: (files: File[]) => void;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  reorderImages: (fromIndex: number, toIndex: number) => void;

  // Drag & Drop Operations
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // Image Reordering Drag & Drop
  handleImageDragStart: (e: React.DragEvent, index: number) => void;
  handleImageDragOver: (e: React.DragEvent, index: number) => void;
  handleImageDragLeave: () => void;
  handleImageDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleImageDragEnd: () => void;

  // Validation
  validateFile: (file: File) => { isValid: boolean; error?: string };
  canAddMoreFiles: () => boolean;
  getImageStats: () => { count: number; totalSize: number; maxReached: boolean };

  // Utilities
  getMainImage: () => File | null;
  getMainImageUrl: () => string | null;
  resetUploadState: () => void;
}

const DEFAULT_CONFIG: Required<ImageUploadConfig> = {
  maxFiles: 10,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  enableReordering: true,
  enableDragDrop: true,
  generatePreviews: true,
  debugEnabled: false
};

// Create logger
const createImageUploadLogger = (enabled: boolean) => createLogger({
  enabled: enabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_IMAGE_UPLOAD === 'true'),
  level: 'debug',
  prefix: 'IMAGE_UPLOAD'
});

/**
 * Custom hook for handling image uploads with drag & drop, reordering, and validation
 * 
 * Features:
 * - Multiple file upload with validation
 * - Drag & drop support for files and reordering
 * - Image preview generation with memory management
 * - File size and type validation
 * - Progress tracking and error handling
 * - Image reordering with drag & drop
 * - Existing image management
 * 
 * @param initialImages - Initial image files
 * @param initialImageUrls - Initial image URLs (for existing images)
 * @param config - Upload configuration options
 * @param onImagesChange - Callback when images change
 * @param onError - Callback when errors occur
 */
export const useImageUpload = ({
  initialImages = [],
  initialImageUrls = [],
  config = {},
  onImagesChange,
  onError
}: UseImageUploadProps): UseImageUploadReturn => {
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = createImageUploadLogger(fullConfig.debugEnabled);
  
  // State
  const [images, setImages] = useState<File[]>(initialImages);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(initialImageUrls);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for cleanup
  const previewUrlsRef = useRef<string[]>([]);

  // Initialize preview URLs for initial images
  useEffect(() => {
    if (initialImages.length > 0 && imagePreviewUrls.length === 0) {
      const urls = initialImages.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(urls);
      previewUrlsRef.current = urls;
      logger.debug('Generated preview URLs for initial images:', urls.length);
    }
  }, [initialImages, imagePreviewUrls.length, logger]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          logger.error('Error revoking object URL:', error);
        }
      });
    };
  }, [logger]);

  // Notify parent component when images change
  useEffect(() => {
    onImagesChange?.(images, [...existingImageUrls, ...imagePreviewUrls]);
  }, [images, imagePreviewUrls, existingImageUrls, onImagesChange]);

  // File validation
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    logger.debug('Validating file:', file.name, file.size, file.type);

    // Check file type
    if (!fullConfig.acceptedTypes.includes(file.type)) {
      const error = `Invalid file type. Accepted types: ${fullConfig.acceptedTypes.join(', ')}`;
      logger.warn('File type validation failed:', error);
      return { isValid: false, error };
    }

    // Check file size
    if (file.size > fullConfig.maxFileSize) {
      const error = `File too large. Maximum size: ${(fullConfig.maxFileSize / 1024 / 1024).toFixed(1)}MB`;
      logger.warn('File size validation failed:', error);
      return { isValid: false, error };
    }

    logger.debug('File validation passed');
    return { isValid: true };
  }, [fullConfig.acceptedTypes, fullConfig.maxFileSize, logger]);

  // Check if more files can be added
  const canAddMoreFiles = useCallback((): boolean => {
    const totalImages = images.length + existingImageUrls.length;
    const canAdd = totalImages < fullConfig.maxFiles;
    logger.debug(`Can add more files: ${canAdd} (current: ${totalImages}, max: ${fullConfig.maxFiles})`);
    return canAdd;
  }, [images.length, existingImageUrls.length, fullConfig.maxFiles, logger]);

  // Add files with validation
  const addFiles = useCallback((files: File[]) => {
    logger.debug('Adding files:', files.length);

    if (!canAddMoreFiles()) {
      const error = `Maximum number of images reached (${fullConfig.maxFiles})`;
      logger.warn(error);
      onError?.(error);
      return;
    }

    const validFiles: File[] = [];
    const newUrls: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        // Check if we can still add more files
        const totalAfterThisFile = images.length + existingImageUrls.length + validFiles.length;
        if (totalAfterThisFile < fullConfig.maxFiles) {
          validFiles.push(file);
          if (fullConfig.generatePreviews) {
            const previewUrl = URL.createObjectURL(file);
            newUrls.push(previewUrl);
            previewUrlsRef.current.push(previewUrl);
          }
        }
      } else {
        logger.warn(`File ${file.name} failed validation:`, validation.error);
        onError?.(validation.error || 'File validation failed');
      }
    });

    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
      if (fullConfig.generatePreviews) {
        setImagePreviewUrls(prev => [...prev, ...newUrls]);
      }
      logger.info(`Added ${validFiles.length} valid files`);
    }
  }, [canAddMoreFiles, fullConfig.maxFiles, fullConfig.generatePreviews, images.length, existingImageUrls.length, validateFile, logger, onError]);

  // Handle file input change
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    logger.debug('File input change:', files.length);
    const fileArray = Array.from(files);
    addFiles(fileArray);

    // Reset the input
    e.target.value = '';
  }, [addFiles, logger]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    logger.debug('Removing image at index:', index);

    const totalExistingImages = existingImageUrls.length;
    
    if (index < totalExistingImages) {
      // Removing existing image
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
      logger.debug('Removed existing image');
    } else {
      // Removing new image
      const newImageIndex = index - totalExistingImages;
      
      // Revoke object URL to prevent memory leaks
      const urlToRevoke = imagePreviewUrls[newImageIndex];
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
        previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== urlToRevoke);
      }
      
      setImages(prev => prev.filter((_, i) => i !== newImageIndex));
      setImagePreviewUrls(prev => prev.filter((_, i) => i !== newImageIndex));
      
      logger.debug('Removed new image and revoked URL');
    }
  }, [existingImageUrls.length, imagePreviewUrls, logger]);

  // Clear all images
  const clearAllImages = useCallback(() => {
    logger.debug('Clearing all images');

    // Revoke all object URLs
    previewUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Error revoking URL during clear:', error);
      }
    });

    setImages([]);
    setImagePreviewUrls([]);
    setExistingImageUrls([]);
    previewUrlsRef.current = [];
    setUploadProgress(0);
    setIsUploading(false);

    logger.info('All images cleared');
  }, [logger]);

  // Reorder images
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    if (!fullConfig.enableReordering) {
      logger.warn('Image reordering is disabled');
      return;
    }

    logger.debug(`Reordering image from ${fromIndex} to ${toIndex}`);

    const totalImages = [...existingImageUrls, ...images];
    const totalUrls = [...existingImageUrls, ...imagePreviewUrls];

    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= totalImages.length || toIndex >= totalImages.length) {
      logger.warn('Invalid reorder indices');
      return;
    }

    // Reorder both arrays
    const newImages = [...totalImages];
    const newUrls = [...totalUrls];

    const movedItem = newImages.splice(fromIndex, 1)[0];
    const movedUrl = newUrls.splice(fromIndex, 1)[0];

    newImages.splice(toIndex, 0, movedItem);
    newUrls.splice(toIndex, 0, movedUrl);

    // Split back into existing and new
    const existingCount = existingImageUrls.length;
    const existingItems = newImages.slice(0, existingCount);
    const newItems = newImages.slice(existingCount);
    
    const existingUrls = newUrls.slice(0, existingCount);
    const newPreviewUrls = newUrls.slice(existingCount);

    // Update state
    setExistingImageUrls(existingUrls as string[]);
    setImages(newItems as File[]);
    setImagePreviewUrls(newPreviewUrls);

    logger.debug('Images reordered successfully');
  }, [fullConfig.enableReordering, existingImageUrls, images, imagePreviewUrls, logger]);

  // Drag & Drop handlers for file upload
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!fullConfig.enableDragDrop) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [fullConfig.enableDragDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!fullConfig.enableDragDrop) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, [fullConfig.enableDragDrop]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (!fullConfig.enableDragDrop) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    logger.debug('Files dropped:', files.length);
    
    if (files.length > 0) {
      addFiles(files);
    }
  }, [fullConfig.enableDragDrop, addFiles, logger]);

  // Image reordering drag & drop handlers
  const handleImageDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!fullConfig.enableReordering) return;

    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    logger.debug('Image drag started:', index);
  }, [fullConfig.enableReordering, logger]);

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!fullConfig.enableReordering) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverImageIndex(index);
  }, [fullConfig.enableReordering]);

  const handleImageDragLeave = useCallback(() => {
    if (!fullConfig.enableReordering) return;
    setDragOverImageIndex(null);
  }, [fullConfig.enableReordering]);

  const handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!fullConfig.enableReordering) return;

    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;

    logger.debug(`Image dropped: ${draggedImageIndex} → ${dropIndex}`);
    reorderImages(draggedImageIndex, dropIndex);

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, [fullConfig.enableReordering, draggedImageIndex, reorderImages, logger]);

  const handleImageDragEnd = useCallback(() => {
    if (!fullConfig.enableReordering) return;

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
    logger.debug('Image drag ended');
  }, [fullConfig.enableReordering, logger]);

  // Utility functions
  const getMainImage = useCallback((): File | null => {
    return images.length > 0 ? images[0] : null;
  }, [images]);

  const getMainImageUrl = useCallback((): string | null => {
    if (existingImageUrls.length > 0) return existingImageUrls[0];
    if (imagePreviewUrls.length > 0) return imagePreviewUrls[0];
    return null;
  }, [existingImageUrls, imagePreviewUrls]);

  const getImageStats = useCallback(() => {
    const totalImages = images.length + existingImageUrls.length;
    const totalSize = images.reduce((sum, file) => sum + file.size, 0);
    
    return {
      count: totalImages,
      totalSize,
      maxReached: totalImages >= fullConfig.maxFiles
    };
  }, [images, existingImageUrls.length, fullConfig.maxFiles]);

  const resetUploadState = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setIsDragOver(false);
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, []);

  return {
    // State
    images,
    imagePreviewUrls,
    existingImageUrls,
    isDragOver,
    draggedImageIndex,
    dragOverImageIndex,
    isUploading,
    uploadProgress,

    // File Operations
    handleFileUpload,
    addFiles,
    removeImage,
    clearAllImages,
    reorderImages,

    // Drag & Drop Operations
    handleDragOver,
    handleDragLeave,
    handleDrop,

    // Image Reordering Drag & Drop
    handleImageDragStart,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDrop,
    handleImageDragEnd,

    // Validation
    validateFile,
    canAddMoreFiles,
    getImageStats,

    // Utilities
    getMainImage,
    getMainImageUrl,
    resetUploadState
  };
};

export default useImageUpload;
