/**
 * Shared Image Validation Utility
 * Used by both car listing uploads and messaging attachments
 */

export interface ImageValidationConfig {
  // File size limits
  maxSizeBytes?: number;
  minSizeBytes?: number;
  
  // Image dimensions
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  
  // Allowed formats
  allowedTypes?: string[];
  allowedExtensions?: string[];
  
  // Quality checks
  checkImageCorruption?: boolean;
  requireValidImageHeader?: boolean;
  
  // Aspect ratio constraints
  minAspectRatio?: number; // width/height
  maxAspectRatio?: number;
  
  // Content safety
  checkImageContent?: boolean; // For future AI-based content moderation
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width: number;
    height: number;
    size: number;
    type: string;
    aspectRatio: number;
  };
}

// Default configurations for different use cases
export const IMAGE_VALIDATION_CONFIGS = {
  // Car listing images - high quality requirements
  CAR_LISTING: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    minSizeBytes: 50 * 1024, // 50KB
    maxWidth: 4000,
    maxHeight: 4000,
    minWidth: 400,
    minHeight: 300,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    checkImageCorruption: true,
    requireValidImageHeader: true,
    minAspectRatio: 0.5, // 1:2 (very tall)
    maxAspectRatio: 3.0, // 3:1 (very wide)
  } as ImageValidationConfig,
  
  // Messaging attachments - more lenient
  MESSAGING: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    minSizeBytes: 1024, // 1KB
    maxWidth: 2000,
    maxHeight: 2000,
    minWidth: 50,
    minHeight: 50,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    checkImageCorruption: false, // Less strict for chat
    requireValidImageHeader: true,
    minAspectRatio: 0.1, // Very flexible
    maxAspectRatio: 10.0,
  } as ImageValidationConfig,
  
  // Profile/avatar images - strict square preference
  PROFILE: {
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    minSizeBytes: 10 * 1024, // 10KB
    maxWidth: 1000,
    maxHeight: 1000,
    minWidth: 100,
    minHeight: 100,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    checkImageCorruption: true,
    requireValidImageHeader: true,
    minAspectRatio: 0.8, // Nearly square
    maxAspectRatio: 1.25, // Nearly square
  } as ImageValidationConfig,
};

/**
 * Validates a single image file
 */
export async function validateImage(
  file: File, 
  config: ImageValidationConfig = IMAGE_VALIDATION_CONFIGS.MESSAGING
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Basic file validation
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors, warnings };
  }
  
  // File size validation
  if (config.maxSizeBytes && file.size > config.maxSizeBytes) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(config.maxSizeBytes)})`);
  }
  
  if (config.minSizeBytes && file.size < config.minSizeBytes) {
    errors.push(`File size (${formatFileSize(file.size)}) is below minimum required size (${formatFileSize(config.minSizeBytes)})`);
  }
  
  // File type validation
  if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
    errors.push(`File type "${file.type}" is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`);
  }
  
  // File extension validation
  if (config.allowedExtensions) {
    const fileExtension = getFileExtension(file.name);
    if (!config.allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension "${fileExtension}" is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
    }
  }
  
  // Image-specific validation
  try {
    const imageMetadata = await getImageMetadata(file);
    
    if (!imageMetadata) {
      if (config.requireValidImageHeader) {
        errors.push('Invalid image file or corrupted image header');
      }
      return { isValid: errors.length === 0, errors, warnings };
    }
    
    const { width, height, aspectRatio } = imageMetadata;
    
    // Dimension validation
    if (config.maxWidth && width > config.maxWidth) {
      errors.push(`Image width (${width}px) exceeds maximum allowed width (${config.maxWidth}px)`);
    }
    
    if (config.maxHeight && height > config.maxHeight) {
      errors.push(`Image height (${height}px) exceeds maximum allowed height (${config.maxHeight}px)`);
    }
    
    if (config.minWidth && width < config.minWidth) {
      errors.push(`Image width (${width}px) is below minimum required width (${config.minWidth}px)`);
    }
    
    if (config.minHeight && height < config.minHeight) {
      errors.push(`Image height (${height}px) is below minimum required height (${config.minHeight}px)`);
    }
    
    // Aspect ratio validation
    if (config.minAspectRatio && aspectRatio < config.minAspectRatio) {
      warnings.push(`Image is very tall (aspect ratio: ${aspectRatio.toFixed(2)}). Consider using a wider image.`);
    }
    
    if (config.maxAspectRatio && aspectRatio > config.maxAspectRatio) {
      warnings.push(`Image is very wide (aspect ratio: ${aspectRatio.toFixed(2)}). Consider using a taller image.`);
    }
    
    // Image corruption check
    if (config.checkImageCorruption) {
      const isCorrupted = await checkImageCorruption(file);
      if (isCorrupted) {
        errors.push('Image appears to be corrupted or incomplete');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: imageMetadata
    };
    
  } catch (error) {
    errors.push(`Failed to validate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Validates multiple images
 */
export async function validateImages(
  files: File[], 
  config: ImageValidationConfig = IMAGE_VALIDATION_CONFIGS.MESSAGING
): Promise<{
  results: ImageValidationResult[];
  allValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}> {
  const results = await Promise.all(
    files.map(file => validateImage(file, config))
  );
  
  const allValid = results.every(result => result.isValid);
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0);
  const totalWarnings = results.reduce((sum, result) => sum + result.warnings.length, 0);
  
  return {
    results,
    allValid,
    totalErrors,
    totalWarnings
  };
}

/**
 * Gets image metadata (dimensions, type, etc.)
 */
async function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  aspectRatio: number;
} | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    
    img.src = url;
  });
}

/**
 * Checks if an image is corrupted
 */
async function checkImageCorruption(file: File): Promise<boolean> {
  try {
    // Try to create a canvas and draw the image
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(true); // Assume corrupted if can't get context
            return;
          }
          
          canvas.width = Math.min(img.naturalWidth, 100);
          canvas.height = Math.min(img.naturalHeight, 100);
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Try to get image data - this will fail for corrupted images
          ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          URL.revokeObjectURL(url);
          resolve(false); // Not corrupted
        } catch {
          URL.revokeObjectURL(url);
          resolve(true); // Corrupted
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(true); // Corrupted
      };
      
      img.src = url;
    });
  } catch {
    return true; // Assume corrupted on any error
  }
}

/**
 * Utility functions
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

/**
 * Convenience functions for specific use cases
 */
export const validateCarListingImage = (file: File) => 
  validateImage(file, IMAGE_VALIDATION_CONFIGS.CAR_LISTING);

export const validateMessagingImage = (file: File) => 
  validateImage(file, IMAGE_VALIDATION_CONFIGS.MESSAGING);

export const validateProfileImage = (file: File) => 
  validateImage(file, IMAGE_VALIDATION_CONFIGS.PROFILE);

export const validateCarListingImages = (files: File[]) => 
  validateImages(files, IMAGE_VALIDATION_CONFIGS.CAR_LISTING);

export const validateMessagingImages = (files: File[]) => 
  validateImages(files, IMAGE_VALIDATION_CONFIGS.MESSAGING);

/**
 * React hook for image validation
 */
export function useImageValidation(config: ImageValidationConfig = IMAGE_VALIDATION_CONFIGS.MESSAGING) {
  const validateSingleImage = async (file: File) => {
    return validateImage(file, config);
  };
  
  const validateMultipleImages = async (files: File[]) => {
    return validateImages(files, config);
  };
  
  return {
    validateImage: validateSingleImage,
    validateImages: validateMultipleImages,
    config
  };
}
