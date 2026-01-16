import { parseSocialLinks, socialLinksToJson, getPlatformInfo, SOCIAL_PLATFORMS } from './socialLinksUtils';

describe('socialLinksUtils', () => {
  describe('parseSocialLinks', () => {
    it('should return empty array for undefined input', () => {
      expect(parseSocialLinks(undefined)).toEqual([]);
    });

    it('should return empty array for null input', () => {
      expect(parseSocialLinks(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseSocialLinks('')).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      expect(parseSocialLinks('not valid json')).toEqual([]);
      expect(parseSocialLinks('{broken')).toEqual([]);
    });

    it('should parse legacy object format', () => {
      const input = JSON.stringify({
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
      });
      
      const result = parseSocialLinks(input);
      
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ platform: 'facebook', url: 'https://facebook.com/test' });
      expect(result).toContainEqual({ platform: 'instagram', url: 'https://instagram.com/test' });
    });

    it('should skip empty values in object format', () => {
      const input = JSON.stringify({
        facebook: 'https://facebook.com/test',
        instagram: '',
        twitter: null,
      });
      
      const result = parseSocialLinks(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ platform: 'facebook', url: 'https://facebook.com/test' });
    });

    it('should parse array format (future-proof)', () => {
      const input = JSON.stringify([
        { platform: 'youtube', url: 'https://youtube.com/@test' },
        { platform: 'tiktok', url: 'https://tiktok.com/@test' },
      ]);
      
      const result = parseSocialLinks(input);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ platform: 'youtube', url: 'https://youtube.com/@test' });
      expect(result[1]).toEqual({ platform: 'tiktok', url: 'https://tiktok.com/@test' });
    });

    it('should filter invalid entries in array format', () => {
      const input = JSON.stringify([
        { platform: 'youtube', url: 'https://youtube.com/@test' },
        { platform: 123, url: 'invalid' }, // Invalid platform type
        { url: 'missing platform' }, // Missing platform
        { platform: 'facebook' }, // Missing url
        'just a string', // Not an object
      ]);
      
      const result = parseSocialLinks(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ platform: 'youtube', url: 'https://youtube.com/@test' });
    });

    it('should handle empty object', () => {
      expect(parseSocialLinks('{}')).toEqual([]);
    });

    it('should handle empty array', () => {
      expect(parseSocialLinks('[]')).toEqual([]);
    });
  });

  describe('socialLinksToJson', () => {
    it('should return empty string for empty array', () => {
      expect(socialLinksToJson([])).toBe('');
    });

    it('should return empty string for undefined', () => {
      // @ts-expect-error Testing edge case
      expect(socialLinksToJson(undefined)).toBe('');
    });

    it('should return empty string for null', () => {
      // @ts-expect-error Testing edge case
      expect(socialLinksToJson(null)).toBe('');
    });

    it('should convert array to object JSON', () => {
      const input = [
        { platform: 'facebook', url: 'https://facebook.com/test' },
        { platform: 'instagram', url: 'https://instagram.com/test' },
      ];
      
      const result = socialLinksToJson(input);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({
        facebook: 'https://facebook.com/test',
        instagram: 'https://instagram.com/test',
      });
    });

    it('should skip entries with empty URLs', () => {
      const input = [
        { platform: 'facebook', url: 'https://facebook.com/test' },
        { platform: 'instagram', url: '' },
        { platform: 'twitter', url: '   ' }, // Whitespace only
      ];
      
      const result = socialLinksToJson(input);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({
        facebook: 'https://facebook.com/test',
      });
    });

    it('should skip entries with missing platform', () => {
      const input = [
        { platform: 'facebook', url: 'https://facebook.com/test' },
        { platform: '', url: 'https://example.com' },
      ];
      
      const result = socialLinksToJson(input);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({
        facebook: 'https://facebook.com/test',
      });
    });

    it('should trim URLs', () => {
      const input = [
        { platform: 'facebook', url: '  https://facebook.com/test  ' },
      ];
      
      const result = socialLinksToJson(input);
      const parsed = JSON.parse(result);
      
      expect(parsed.facebook).toBe('https://facebook.com/test');
    });

    it('should return empty string when all entries are invalid', () => {
      const input = [
        { platform: '', url: '' },
        { platform: 'twitter', url: '   ' },
      ];
      
      expect(socialLinksToJson(input)).toBe('');
    });

    it('should handle single entry', () => {
      const input = [{ platform: 'whatsapp', url: '+1234567890' }];
      
      const result = socialLinksToJson(input);
      const parsed = JSON.parse(result);
      
      expect(parsed).toEqual({ whatsapp: '+1234567890' });
    });
  });

  describe('round-trip conversion', () => {
    it('should preserve data through parse -> serialize -> parse cycle', () => {
      const original = [
        { platform: 'facebook', url: 'https://facebook.com/test' },
        { platform: 'youtube', url: 'https://youtube.com/@test' },
        { platform: 'whatsapp', url: '+963912345678' },
      ];
      
      const json = socialLinksToJson(original);
      const parsed = parseSocialLinks(json);
      
      // Sort both for comparison (order might differ)
      const sortedOriginal = [...original].sort((a, b) => a.platform.localeCompare(b.platform));
      const sortedParsed = [...parsed].sort((a, b) => a.platform.localeCompare(b.platform));
      
      expect(sortedParsed).toEqual(sortedOriginal);
    });

    it('should handle legacy format through cycle', () => {
      const legacyJson = '{"facebook":"https://facebook.com/legacy","instagram":"https://instagram.com/legacy"}';
      
      const parsed = parseSocialLinks(legacyJson);
      const serialized = socialLinksToJson(parsed);
      const reparsed = parseSocialLinks(serialized);
      
      expect(reparsed).toHaveLength(2);
      expect(reparsed).toContainEqual({ platform: 'facebook', url: 'https://facebook.com/legacy' });
      expect(reparsed).toContainEqual({ platform: 'instagram', url: 'https://instagram.com/legacy' });
    });
  });

  describe('getPlatformInfo', () => {
    it('should return platform info for valid ID', () => {
      const facebook = getPlatformInfo('facebook');
      
      expect(facebook).toBeDefined();
      expect(facebook?.name).toBe('Facebook');
      expect(facebook?.icon).toBe('📘');
    });

    it('should return undefined for unknown platform', () => {
      expect(getPlatformInfo('unknown')).toBeUndefined();
      expect(getPlatformInfo('')).toBeUndefined();
    });

    it('should have all expected platforms', () => {
      const expectedPlatforms = [
        'facebook', 'instagram', 'whatsapp', 'youtube', 
        'tiktok', 'twitter', 'linkedin', 'snapchat', 'telegram', 'website'
      ];
      
      for (const platformId of expectedPlatforms) {
        expect(getPlatformInfo(platformId)).toBeDefined();
      }
    });
  });

  describe('SOCIAL_PLATFORMS constant', () => {
    it('should have unique IDs', () => {
      const ids = SOCIAL_PLATFORMS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have all required fields for each platform', () => {
      for (const platform of SOCIAL_PLATFORMS) {
        expect(platform.id).toBeTruthy();
        expect(platform.name).toBeTruthy();
        expect(platform.icon).toBeTruthy();
        expect(platform.placeholder).toBeTruthy();
        expect(platform.color).toBeTruthy();
      }
    });
  });
});
