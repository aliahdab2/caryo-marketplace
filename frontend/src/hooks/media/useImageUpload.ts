import { useState, useCallback, useRef, useEffect } from 'react';

interface ImageFile {
  file: File;
  id: string;
  preview?: string;
}

interface UseImageUploadOptions {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  enableReordering?: boolean;
  onUpload?: (files: ImageFile[]) => void;
  onError?: (error: string) => void;
}

interface UseImageUploadReturn {
  images: ImageFile[];
  imagePreviewUrls: string[];
  draggedImageIndex: number | null;
  dragOverImageIndex: number | null;
  isDragOver: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (index: number) => void;
  handleImageDragStart: (e: React.DragEvent, index: number) => void;
  handleImageDragOver: (e: React.DragEvent, index: number) => void;
  handleImageDragLeave: () => void;
  handleImageDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleImageDragEnd: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  clearImages: () => void;
  uploadProgress: number;
  isUploading: boolean;
}

/**
 * Custom hook for image upload management
 * 
 * Features:
 * - Multiple file upload with validation
 * - Drag and drop support
 * - Image reordering
 * - Preview generation
 * - Memory leak prevention
 * - Progress tracking
 * 
 * @param options Configuration options
 * @returns Image upload utilities
 */
export const useImageUpload = ({
  maxFiles = 10,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  enableReordering = true,
  onUpload,
  onError
}: UseImageUploadOptions = {}): UseImageUploadReturn => {
  
  const [images, setImages] = useState<ImageFile[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const previewUrlsRef = useRef<string[]>([]);

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Generate preview URLs for images
  useEffect(() => {
    // Cleanup old URLs
    previewUrlsRef.current.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });

    // Generate new URLs
    const newPreviewUrls = images.map(image => {
      if (image.preview) {
        return image.preview;
      }
      const url = URL.createObjectURL(image.file);
      return url;
    });

    previewUrlsRef.current = newPreviewUrls;
    setImagePreviewUrls(newPreviewUrls);
  }, [images]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Supported types: ${acceptedTypes.join(', ')}`;
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = maxSizeBytes / (1024 * 1024);
      return `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum ${maxSizeMB}MB`;
    }

    return null;
  }, [acceptedTypes, maxSizeBytes]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    setIsUploading(true);
    
    // Check if adding files would exceed limit
    if (images.length + files.length > maxFiles) {
      onError?.(`Cannot upload ${files.length} files. Maximum ${maxFiles} files allowed. You have ${images.length} files already.`);
      setIsUploading(false);
      return;
    }

    // Validate and process files
    const validFiles: ImageFile[] = [];

    files.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        onError?.(error);
      } else {
        validFiles.push({
          file,
          id: `${Date.now()}-${index}`,
        });
      }
      
      // Update progress
      setUploadProgress(((index + 1) / files.length) * 100);
    });

    if (validFiles.length > 0) {
      setImages(prev => {
        const newImages = [...prev, ...validFiles];
        onUpload?.(newImages);
        return newImages;
      });
    }

    setIsUploading(false);
    setUploadProgress(0);
    
    // Clear input
    e.target.value = '';
  }, [images.length, maxFiles, validateFile, onUpload, onError]);

  // Remove image
  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      onUpload?.(newImages);
      return newImages;
    });

    // Cleanup preview URL
    const urlToRevoke = imagePreviewUrls[index];
    if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
  }, [imagePreviewUrls, onUpload]);

  // Drag and drop handlers for reordering
  const handleImageDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!enableReordering) return;
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [enableReordering]);

  const handleImageDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!enableReordering) return;
    e.preventDefault();
    setDragOverImageIndex(index);
  }, [enableReordering]);

  const handleImageDragLeave = useCallback(() => {
    setDragOverImageIndex(null);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    if (!enableReordering || draggedImageIndex === null) return;
    
    e.preventDefault();
    
    if (draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    setImages(prev => {
      const newImages = [...prev];
      const draggedImage = newImages[draggedImageIndex];
      
      // Remove from old position
      newImages.splice(draggedImageIndex, 1);
      
      // Insert at new position
      newImages.splice(dropIndex, 0, draggedImage);
      
      onUpload?.(newImages);
      return newImages;
    });

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, [draggedImageIndex, enableReordering, onUpload]);

  const handleImageDragEnd = useCallback(() => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  }, []);

  // Drag and drop handlers for upload area
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // Create a synthetic event to reuse existing upload logic
      const syntheticEvent = {
        target: { 
          files: imageFiles,
          value: ''
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      handleImageUpload(syntheticEvent);
    }
  }, [handleImageUpload]);

  // Clear all images
  const clearImages = useCallback(() => {
    // Cleanup all preview URLs
    imagePreviewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    setImages([]);
    setImagePreviewUrls([]);
    onUpload?.([]);
  }, [imagePreviewUrls, onUpload]);

  return {
    images,
    imagePreviewUrls,
    draggedImageIndex,
    dragOverImageIndex,
    isDragOver,
    handleImageUpload,
    removeImage,
    handleImageDragStart,
    handleImageDragOver,
    handleImageDragLeave,
    handleImageDrop,
    handleImageDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearImages,
    uploadProgress,
    isUploading
  };
};

export default useImageUpload;
