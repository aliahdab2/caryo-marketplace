import {
  isVideoMedia,
  getMediaType,
  isYouTubeUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  processVideoForGallery,
  getDefaultImageUrl
} from '../mediaUtils';
import type { MediaItem } from '@/types/media';

describe('mediaUtils', () => {
  describe('isVideoMedia', () => {
    it('should return true for direct isVideo flag', () => {
      const item: MediaItem = {
        url: 'test.mp4',
        isVideo: true
      };

      expect(isVideoMedia(item)).toBe(true);
    });

    it('should return false for direct isVideo flag set to false', () => {
      const item: MediaItem = {
        url: 'test.jpg',
        isVideo: false
      };

      expect(isVideoMedia(item)).toBe(false);
    });

    it('should detect video by type field', () => {
      const testCases = [
        { type: 'video', expected: true },
        { type: 'video/mp4', expected: true },
        { type: 'video/webm', expected: true },
        { type: 'video/quicktime', expected: true },
        { type: 'VIDEO', expected: true }, // case insensitive
        { type: 'image', expected: false },
        { type: 'image/jpeg', expected: false }
      ];

      testCases.forEach(({ type, expected }) => {
        const item: MediaItem = {
          url: 'test.mp4',
          type
        };
        expect(isVideoMedia(item)).toBe(expected);
      });
    });

    it('should detect video by contentType field', () => {
      const testCases = [
        { contentType: 'video/mp4', expected: true },
        { contentType: 'video/webm', expected: true },
        { contentType: 'video/quicktime', expected: true },
        { contentType: 'VIDEO/MP4', expected: true }, // case insensitive
        { contentType: 'image/jpeg', expected: false },
        { contentType: 'text/plain', expected: false }
      ];

      testCases.forEach(({ contentType, expected }) => {
        const item: MediaItem = {
          url: 'test.mp4',
          contentType
        };
        expect(isVideoMedia(item)).toBe(expected);
      });
    });

    it('should detect YouTube videos by URL', () => {
      const testCases = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: true },
        { url: 'https://youtu.be/dQw4w9WgXcQ', expected: true },
        { url: 'https://youtube.com/embed/dQw4w9WgXcQ', expected: true },
        { url: 'https://vimeo.com/123456', expected: false },
        { url: 'https://example.com/video.mp4', expected: false },
        { url: 'not-a-url', expected: false }
      ];

      testCases.forEach(({ url, expected }) => {
        const item: MediaItem = { url };
        expect(isVideoMedia(item)).toBe(expected);
      });
    });

    it('should return false for null or undefined items', () => {
      expect(isVideoMedia(null as any)).toBe(false);
      expect(isVideoMedia(undefined as any)).toBe(false);
    });

    it('should return false for items without video indicators', () => {
      const item: MediaItem = {
        url: 'test.jpg',
        type: 'image/jpeg',
        contentType: 'image/jpeg'
      };

      expect(isVideoMedia(item)).toBe(false);
    });

    it('should prioritize isVideo flag over other detection methods', () => {
      const item: MediaItem = {
        url: 'test.jpg',
        type: 'image/jpeg',
        isVideo: true // This should take priority
      };

      expect(isVideoMedia(item)).toBe(true);
    });
  });

  describe('getMediaType', () => {
    it('should return "video" for video media', () => {
      const videoItem: MediaItem = {
        url: 'test.mp4',
        isVideo: true
      };

      expect(getMediaType(videoItem)).toBe('video');
    });

    it('should return "image" for non-video media', () => {
      const imageItem: MediaItem = {
        url: 'test.jpg',
        type: 'image/jpeg'
      };

      expect(getMediaType(imageItem)).toBe('image');
    });

    it('should return "image" for null or undefined items', () => {
      expect(getMediaType(null as any)).toBe('image');
      expect(getMediaType(undefined as any)).toBe('image');
    });
  });

  describe('isYouTubeUrl', () => {
    it('should detect standard YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should detect short YouTube URLs', () => {
      expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(isYouTubeUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should detect embed YouTube URLs', () => {
      expect(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for non-YouTube URLs', () => {
      expect(isYouTubeUrl('https://vimeo.com/123456')).toBe(false);
      expect(isYouTubeUrl('https://example.com/video')).toBe(false);
      expect(isYouTubeUrl('not-a-url')).toBe(false);
      expect(isYouTubeUrl('')).toBe(false);
      expect(isYouTubeUrl(null as any)).toBe(false);
      expect(isYouTubeUrl(undefined as any)).toBe(false);
    });
  });

  describe('getYouTubeEmbedUrl', () => {
    it('should extract video ID and return embed URL', () => {
      expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');

      expect(getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      expect(getYouTubeEmbedUrl('https://vimeo.com/123456')).toBe(null);
      expect(getYouTubeEmbedUrl('not-a-url')).toBe(null);
      expect(getYouTubeEmbedUrl('')).toBe(null);
      expect(getYouTubeEmbedUrl(null as any)).toBe(null);
    });
  });

  describe('getYouTubeThumbnailUrl', () => {
    it('should extract video ID and return thumbnail URL', () => {
      expect(getYouTubeThumbnailUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
        .toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');

      expect(getYouTubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ'))
        .toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should return null for invalid URLs', () => {
      expect(getYouTubeThumbnailUrl('https://vimeo.com/123456')).toBe(null);
      expect(getYouTubeThumbnailUrl('not-a-url')).toBe(null);
      expect(getYouTubeThumbnailUrl('')).toBe(null);
      expect(getYouTubeThumbnailUrl(null as any)).toBe(null);
    });
  });

  describe('processVideoForGallery', () => {
    it('should process YouTube URLs correctly', () => {
      const result = processVideoForGallery('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(result).toEqual({
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isYouTube: true,
        videoId: 'dQw4w9WgXcQ'
      });
    });

    it('should return null values for non-YouTube URLs', () => {
      const result = processVideoForGallery('https://example.com/video.mp4');

      expect(result).toEqual({
        thumbnailUrl: null,
        embedUrl: null,
        isYouTube: false
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const result = processVideoForGallery('');

      expect(result).toEqual({
        thumbnailUrl: null,
        embedUrl: null,
        isYouTube: false
      });
    });
  });

  describe('getDefaultImageUrl', () => {
    it('should return the correct default image path', () => {
      expect(getDefaultImageUrl()).toBe('/images/vehicles/car-default.svg');
    });
  });
});
