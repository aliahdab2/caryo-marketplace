import { useState, useCallback, useRef, useEffect } from 'react';
import { createLogger } from '@/utils/logger';

export interface VideoUploadConfig {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  maxDuration?: number; // in seconds
  acceptedTypes?: string[];
  enableUpload?: boolean;
  enableUrlInput?: boolean;
  generatePreviews?: boolean;
  debugEnabled?: boolean;
}

export interface VideoFile {
  file: File;
  previewUrl: string;
  duration?: number;
  id: string;
}

export interface UseVideoHandlingProps {
  initialVideos?: File[];
  initialVideoUrls?: string[];
  config?: VideoUploadConfig;
  onVideosChange?: (videos: File[], videoUrls: string[]) => void;
  onError?: (error: string) => void;
}

export interface UseVideoHandlingReturn {
  // State
  videos: File[];
  videoPreviewUrls: string[];
  videoUrls: string[];
  isVideoUploadEnabled: boolean;
  isVideoUrlEnabled: boolean;
  isAnyVideoFeatureEnabled: boolean;
  showVideoUpload: boolean;
  showVideoUrl: boolean;
  isProcessing: boolean;
  uploadProgress: number;

  // File Operations
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addVideoFiles: (files: File[]) => void;
  removeVideo: (index: number) => void;
  clearAllVideos: () => void;

  // URL Operations
  handleVideoUrlChange: (url: string) => void;
  addVideoUrl: (url: string) => void;
  removeVideoUrl: (index: number) => void;
  clearAllVideoUrls: () => void;

  // UI Controls
  setShowVideoUpload: (show: boolean) => void;
  setShowVideoUrl: (show: boolean) => void;
  toggleVideoUpload: () => void;
  toggleVideoUrl: () => void;

  // Validation & Utils
  validateVideoFile: (file: File) => Promise<{ isValid: boolean; error?: string; duration?: number }>;
  validateVideoUrl: (url: string) => { isValid: boolean; error?: string };
  getVideoEmbedUrl: (url: string) => string | null;
  canAddMoreFiles: () => boolean;
  canAddMoreUrls: () => boolean;
  getVideoStats: () => { fileCount: number; urlCount: number; totalSize: number };
  resetVideoState: () => void;
}

const DEFAULT_CONFIG: Required<VideoUploadConfig> = {
  maxFiles: 1,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxDuration: 180, // 3 minutes
  acceptedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
  enableUpload: true,
  enableUrlInput: true,
  generatePreviews: true,
  debugEnabled: false
};

// Create logger
const createVideoLogger = (enabled: boolean) => createLogger({
  enabled: enabled && (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_VIDEO_HANDLING === 'true'),
  level: 'debug',
  prefix: 'VIDEO_HANDLING'
});

/**
 * Custom hook for handling video uploads and URL inputs
 * 
 * Features:
 * - Video file upload with validation (size, duration, type)
 * - Video URL input with validation and embed URL generation
 * - Support for YouTube, Vimeo, and other platforms
 * - Video preview generation with memory management
 * - Configurable upload and URL input enabling/disabling
 * - Progress tracking and error handling
 * 
 * @param initialVideos - Initial video files
 * @param initialVideoUrls - Initial video URLs
 * @param config - Video handling configuration
 * @param onVideosChange - Callback when videos change
 * @param onError - Callback when errors occur
 */
export const useVideoHandling = ({
  initialVideos = [],
  initialVideoUrls = [],
  config = {},
  onVideosChange,
  onError
}: UseVideoHandlingProps): UseVideoHandlingReturn => {
  
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const logger = createVideoLogger(fullConfig.debugEnabled);
  
  // State
  const [videos, setVideos] = useState<File[]>(initialVideos);
  const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>(initialVideoUrls);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showVideoUrl, setShowVideoUrl] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs for cleanup
  const previewUrlsRef = useRef<string[]>([]);

  // Configuration flags
  const isVideoUploadEnabled = fullConfig.enableUpload;
  const isVideoUrlEnabled = fullConfig.enableUrlInput;
  const isAnyVideoFeatureEnabled = isVideoUploadEnabled || isVideoUrlEnabled;

  // Initialize preview URLs for initial videos
  useEffect(() => {
    if (initialVideos.length > 0 && videoPreviewUrls.length === 0) {
      const urls = initialVideos.map(file => URL.createObjectURL(file));
      setVideoPreviewUrls(urls);
      previewUrlsRef.current = urls;
      logger.debug('Generated preview URLs for initial videos:', urls.length);
    }
  }, [initialVideos, videoPreviewUrls.length, logger]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          logger.error('Error revoking video URL:', error);
        }
      });
    };
  }, [logger]);

  // Notify parent component when videos change
  useEffect(() => {
    onVideosChange?.(videos, videoUrls);
  }, [videos, videoUrls, onVideosChange]);

  // Video file validation with duration check
  const validateVideoFile = useCallback(async (file: File): Promise<{ isValid: boolean; error?: string; duration?: number }> => {
    logger.debug('Validating video file:', file.name, file.size, file.type);

    // Check file type
    if (!fullConfig.acceptedTypes.includes(file.type)) {
      const error = `Invalid video type. Accepted types: ${fullConfig.acceptedTypes.join(', ')}`;
      logger.warn('Video type validation failed:', error);
      return { isValid: false, error };
    }

    // Check file size
    if (file.size > fullConfig.maxFileSize) {
      const error = `Video too large. Maximum size: ${(fullConfig.maxFileSize / 1024 / 1024).toFixed(1)}MB`;
      logger.warn('Video size validation failed:', error);
      return { isValid: false, error };
    }

    // Check video duration (if possible)
    try {
      const duration = await getVideoDuration(file);
      logger.debug('Video duration:', duration);

      if (duration > fullConfig.maxDuration) {
        const error = `Video too long. Maximum duration: ${fullConfig.maxDuration}s`;
        logger.warn('Video duration validation failed:', error);
        return { isValid: false, error };
      }

      return { isValid: true, duration };
    } catch (error) {
      logger.warn('Could not determine video duration, allowing upload:', error);
      return { isValid: true };
    }
  }, [fullConfig.acceptedTypes, fullConfig.maxFileSize, fullConfig.maxDuration, logger]);

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Could not load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Video URL validation
  const validateVideoUrl = useCallback((url: string): { isValid: boolean; error?: string } => {
    logger.debug('Validating video URL:', url);

    if (!url || url.trim() === '') {
      return { isValid: false, error: 'URL is required' };
    }

    try {
      const urlObj = new URL(url);
      
      // Check for supported domains
      const supportedDomains = [
        'youtube.com', 'www.youtube.com', 'youtu.be',
        'vimeo.com', 'www.vimeo.com',
        'dailymotion.com', 'www.dailymotion.com'
      ];

      const isSupported = supportedDomains.some(domain => 
        urlObj.hostname.toLowerCase().includes(domain.toLowerCase())
      );

      if (!isSupported) {
        logger.debug('URL validation passed for non-standard domain');
        // Allow non-standard domains but warn
      }

      logger.debug('Video URL validation passed');
      return { isValid: true };
    } catch (error) {
      logger.warn('Invalid URL format:', error);
      return { isValid: false, error: 'Invalid URL format' };
    }
  }, [logger]);

  // Generate embed URL for supported platforms
  const getVideoEmbedUrl = useCallback((url: string): string | null => {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Vimeo
      else if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }
      
      // Dailymotion
      else if (urlObj.hostname.includes('dailymotion.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        if (videoId) {
          return `https://www.dailymotion.com/embed/video/${videoId}`;
        }
      }

      logger.debug('No embed URL generated for:', url);
      return null;
    } catch (error) {
      logger.error('Error generating embed URL:', error);
      return null;
    }
  }, [logger]);

  // Check if more files can be added
  const canAddMoreFiles = useCallback((): boolean => {
    const canAdd = videos.length < fullConfig.maxFiles;
    logger.debug(`Can add more video files: ${canAdd} (current: ${videos.length}, max: ${fullConfig.maxFiles})`);
    return canAdd;
  }, [videos.length, fullConfig.maxFiles, logger]);

  // Check if more URLs can be added
  const canAddMoreUrls = useCallback((): boolean => {
    const canAdd = videoUrls.length < 1; // Usually limit to 1 URL
    logger.debug(`Can add more video URLs: ${canAdd} (current: ${videoUrls.length})`);
    return canAdd;
  }, [videoUrls.length, logger]);

  // Add video files
  const addVideoFiles = useCallback(async (files: File[]) => {
    if (!isVideoUploadEnabled) {
      logger.warn('Video upload is disabled');
      return;
    }

    logger.debug('Adding video files:', files.length);

    if (!canAddMoreFiles()) {
      const error = `Maximum number of videos reached (${fullConfig.maxFiles})`;
      logger.warn(error);
      onError?.(error);
      return;
    }

    setIsProcessing(true);
    const validFiles: File[] = [];
    const newUrls: string[] = [];

    for (const file of files) {
      if (videos.length + validFiles.length >= fullConfig.maxFiles) break;

      const validation = await validateVideoFile(file);
      if (validation.isValid) {
        validFiles.push(file);
        if (fullConfig.generatePreviews) {
          const previewUrl = URL.createObjectURL(file);
          newUrls.push(previewUrl);
          previewUrlsRef.current.push(previewUrl);
        }
      } else {
        logger.warn(`Video ${file.name} failed validation:`, validation.error);
        onError?.(validation.error || 'Video validation failed');
      }
    }

    if (validFiles.length > 0) {
      setVideos(prev => [...prev, ...validFiles]);
      if (fullConfig.generatePreviews) {
        setVideoPreviewUrls(prev => [...prev, ...newUrls]);
      }
      logger.info(`Added ${validFiles.length} valid video files`);
    }

    setIsProcessing(false);
  }, [isVideoUploadEnabled, canAddMoreFiles, fullConfig.maxFiles, fullConfig.generatePreviews, videos.length, validateVideoFile, logger, onError]);

  // Handle video file upload
  const handleVideoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    logger.debug('Video file input change:', files.length);
    const fileArray = Array.from(files);
    await addVideoFiles(fileArray);

    // Reset the input
    e.target.value = '';
  }, [addVideoFiles, logger]);

  // Remove video file
  const removeVideo = useCallback((index: number) => {
    logger.debug('Removing video at index:', index);

    // Revoke object URL to prevent memory leaks
    const urlToRevoke = videoPreviewUrls[index];
    if (urlToRevoke) {
      URL.revokeObjectURL(urlToRevoke);
      previewUrlsRef.current = previewUrlsRef.current.filter(url => url !== urlToRevoke);
    }

    setVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreviewUrls(prev => prev.filter((_, i) => i !== index));

    logger.debug('Video removed and URL revoked');
  }, [videoPreviewUrls, logger]);

  // Clear all video files
  const clearAllVideos = useCallback(() => {
    logger.debug('Clearing all video files');

    // Revoke all object URLs
    previewUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.error('Error revoking video URL during clear:', error);
      }
    });

    setVideos([]);
    setVideoPreviewUrls([]);
    previewUrlsRef.current = [];

    logger.info('All video files cleared');
  }, [logger]);

  // Add video URL
  const addVideoUrl = useCallback((url: string) => {
    if (!isVideoUrlEnabled) {
      logger.warn('Video URL input is disabled');
      return;
    }

    if (!canAddMoreUrls()) {
      const error = 'Maximum number of video URLs reached';
      logger.warn(error);
      onError?.(error);
      return;
    }

    const validation = validateVideoUrl(url);
    if (validation.isValid) {
      setVideoUrls(prev => [...prev, url]);
      logger.info('Video URL added:', url);
    } else {
      logger.warn('Video URL validation failed:', validation.error);
      onError?.(validation.error || 'Invalid video URL');
    }
  }, [isVideoUrlEnabled, canAddMoreUrls, validateVideoUrl, logger, onError]);

  // Handle video URL change
  const handleVideoUrlChange = useCallback((url: string) => {
    logger.debug('Video URL changed:', url);

    if (url.trim() === '') {
      setVideoUrls([]);
      return;
    }

    const validation = validateVideoUrl(url);
    if (validation.isValid) {
      setVideoUrls([url]);
    }
  }, [validateVideoUrl, logger]);

  // Remove video URL
  const removeVideoUrl = useCallback((index: number) => {
    logger.debug('Removing video URL at index:', index);
    setVideoUrls(prev => prev.filter((_, i) => i !== index));
  }, [logger]);

  // Clear all video URLs
  const clearAllVideoUrls = useCallback(() => {
    logger.debug('Clearing all video URLs');
    setVideoUrls([]);
  }, [logger]);

  // UI control functions
  const toggleVideoUpload = useCallback(() => {
    setShowVideoUpload(prev => !prev);
  }, []);

  const toggleVideoUrl = useCallback(() => {
    setShowVideoUrl(prev => !prev);
  }, []);

  // Get video statistics
  const getVideoStats = useCallback(() => {
    const totalSize = videos.reduce((sum, file) => sum + file.size, 0);
    
    return {
      fileCount: videos.length,
      urlCount: videoUrls.length,
      totalSize
    };
  }, [videos, videoUrls.length]);

  // Reset all video state
  const resetVideoState = useCallback(() => {
    clearAllVideos();
    clearAllVideoUrls();
    setShowVideoUpload(false);
    setShowVideoUrl(false);
    setIsProcessing(false);
    setUploadProgress(0);
    logger.debug('Video state reset');
  }, [clearAllVideos, clearAllVideoUrls, logger]);

  return {
    // State
    videos,
    videoPreviewUrls,
    videoUrls,
    isVideoUploadEnabled,
    isVideoUrlEnabled,
    isAnyVideoFeatureEnabled,
    showVideoUpload,
    showVideoUrl,
    isProcessing,
    uploadProgress,

    // File Operations
    handleVideoUpload,
    addVideoFiles,
    removeVideo,
    clearAllVideos,

    // URL Operations
    handleVideoUrlChange,
    addVideoUrl,
    removeVideoUrl,
    clearAllVideoUrls,

    // UI Controls
    setShowVideoUpload,
    setShowVideoUrl,
    toggleVideoUpload,
    toggleVideoUrl,

    // Validation & Utils
    validateVideoFile,
    validateVideoUrl,
    getVideoEmbedUrl,
    canAddMoreFiles,
    canAddMoreUrls,
    getVideoStats,
    resetVideoState
  };
};

export default useVideoHandling;
