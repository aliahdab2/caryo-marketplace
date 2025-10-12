import { 
  extractLocale, 
  generateLocaleMetadata, 
  parseSearchParams, 
  generateLocaleRedirect,
  withLocale,
  type LocalePageProps 
} from '../localeUtils';

// Mock the i18n config
jest.mock('@/app/i18n/config', () => ({
  locales: ['en', 'ar'] as const,
  defaultLocale: 'en' as const,
  isValidLocale: (locale: string): locale is 'en' | 'ar' => {
    return ['en', 'ar'].includes(locale);
  },
  localeDirections: {
    en: 'ltr',
    ar: 'rtl',
  },
}));

describe('Locale Utilities', () => {
  describe('extractLocale', () => {
    it('should extract valid English locale', async () => {
      const params = Promise.resolve({ locale: 'en', slug: 'test' });
      const result = await extractLocale(params);
      expect(result).toBe('en');
    });

    it('should extract valid Arabic locale', async () => {
      const params = Promise.resolve({ locale: 'ar', slug: 'test' });
      const result = await extractLocale(params);
      expect(result).toBe('ar');
    });

    it('should throw error for invalid locale', async () => {
      const params = Promise.resolve({ locale: 'fr', slug: 'test' });
      await expect(extractLocale(params)).rejects.toThrow('Invalid locale: fr');
    });

    it('should throw error for empty locale', async () => {
      const params = Promise.resolve({ locale: '', slug: 'test' });
      await expect(extractLocale(params)).rejects.toThrow('Invalid locale: ');
    });
  });

  describe('generateLocaleMetadata', () => {
    it('should generate English metadata with LTR direction', () => {
      const metadata = generateLocaleMetadata(
        'en',
        'Test Title',
        'Test Description',
        '/test-path'
      );

      expect(metadata.title).toBe('Test Title');
      expect(metadata.description).toBe('Test Description');
      expect(metadata.openGraph?.title).toBe('Test Title');
      expect(metadata.openGraph?.description).toBe('Test Description');
      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.twitter?.title).toBe('Test Title');
      expect(metadata.other?.['content-language']).toBe('en');
      expect(metadata.other?.['direction']).toBe('ltr');
      expect(metadata.alternates?.languages).toEqual({
        'en': '/en/test-path',
        'ar': '/ar/test-path',
      });
    });

    it('should generate Arabic metadata with RTL direction', () => {
      const metadata = generateLocaleMetadata(
        'ar',
        'عنوان الاختبار',
        'وصف الاختبار',
        '/test-path'
      );

      expect(metadata.title).toBe('عنوان الاختبار');
      expect(metadata.description).toBe('وصف الاختبار');
      expect(metadata.openGraph?.locale).toBe('ar_SY');
      expect(metadata.other?.['content-language']).toBe('ar');
      expect(metadata.other?.['direction']).toBe('rtl');
      expect(metadata.alternates?.languages).toEqual({
        'en': '/en/test-path',
        'ar': '/ar/test-path',
      });
    });

    it('should generate metadata without alternates when path is not provided', () => {
      const metadata = generateLocaleMetadata(
        'en',
        'Test Title',
        'Test Description'
      );

      expect(metadata.title).toBe('Test Title');
      expect(metadata.description).toBe('Test Description');
      expect(metadata.alternates).toBeUndefined();
    });

    it('should include all required OpenGraph and Twitter metadata', () => {
      const metadata = generateLocaleMetadata(
        'en',
        'SEO Title',
        'SEO Description',
        '/seo-path'
      );

      expect(metadata.openGraph).toEqual({
        title: 'SEO Title',
        description: 'SEO Description',
        type: 'website',
        locale: 'en_US',
      });

      expect(metadata.twitter).toEqual({
        title: 'SEO Title',
        description: 'SEO Description',
        card: 'summary_large_image',
      });
    });
  });

  describe('parseSearchParams', () => {
    it('should parse simple search params', async () => {
      const searchParams = Promise.resolve({
        brand: 'toyota',
        year: '2020',
        location: 'damascus',
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        brand: 'toyota',
        year: '2020',
        location: 'damascus',
      });
    });

    it('should handle array values', async () => {
      const searchParams = Promise.resolve({
        brands: ['toyota', 'honda'],
        colors: ['red', 'blue'],
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        brands: ['toyota', 'honda'],
        colors: ['red', 'blue'],
      });
    });

    it('should parse comma-separated values into arrays', async () => {
      const searchParams = Promise.resolve({
        brands: 'toyota,honda,bmw',
        locations: 'damascus,aleppo',
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        brands: ['toyota', 'honda', 'bmw'],
        locations: ['damascus', 'aleppo'],
      });
    });

    it('should filter out empty values from comma-separated strings', async () => {
      const searchParams = Promise.resolve({
        brands: 'toyota,,honda,',
        locations: ',damascus,',
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        brands: ['toyota', 'honda'],
        locations: ['damascus'],
      });
    });

    it('should handle undefined search params', async () => {
      const result = await parseSearchParams(undefined);
      expect(result).toEqual({});
    });

    it('should handle empty search params', async () => {
      const searchParams = Promise.resolve({});
      const result = await parseSearchParams(searchParams);
      expect(result).toEqual({});
    });

    it('should ignore undefined values', async () => {
      const searchParams = Promise.resolve({
        brand: 'toyota',
        year: undefined,
        location: 'damascus',
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        brand: 'toyota',
        location: 'damascus',
      });
    });
  });

  describe('generateLocaleRedirect', () => {
    it('should generate English redirect URL', () => {
      const url = generateLocaleRedirect('en', '/search');
      expect(url).toBe('/en/search');
    });

    it('should generate Arabic redirect URL', () => {
      const url = generateLocaleRedirect('ar', '/listings');
      expect(url).toBe('/ar/listings');
    });

    it('should handle paths without leading slash', () => {
      const url = generateLocaleRedirect('en', 'search');
      expect(url).toBe('/en/search');
    });

    it('should include search parameters', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('brand', 'toyota');
      searchParams.set('year', '2020');

      const url = generateLocaleRedirect('en', '/search', searchParams);
      expect(url).toBe('/en/search?brand=toyota&year=2020');
    });

    it('should handle empty search parameters', () => {
      const searchParams = new URLSearchParams();
      const url = generateLocaleRedirect('ar', '/listings', searchParams);
      expect(url).toBe('/ar/listings');
    });

    it('should handle root path', () => {
      const url = generateLocaleRedirect('ar', '/');
      expect(url).toBe('/ar/');
    });
  });

  describe('withLocale', () => {
    const mockHandler = jest.fn();

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should call handler with valid English locale', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      };

      mockHandler.mockResolvedValue('Test Component' as React.ReactNode);

      const result = await withLocale(props, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith('en', props);
      expect(result).toEqual('Test Component');
    });

    it('should call handler with valid Arabic locale', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ locale: 'ar' }),
        searchParams: Promise.resolve({}),
      };

      mockHandler.mockResolvedValue('مكون الاختبار' as React.ReactNode);

      const result = await withLocale(props, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith('ar', props);
      expect(result).toEqual('مكون الاختبار');
    });

    it('should throw error for invalid locale', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ locale: 'fr' }),
        searchParams: Promise.resolve({}),
      };

      await expect(withLocale(props, mockHandler)).rejects.toThrow('Invalid locale: fr');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should handle handler errors gracefully', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ locale: 'en' }),
        searchParams: Promise.resolve({}),
      };

      const handlerError = new Error('Handler failed');
      mockHandler.mockRejectedValue(handlerError);

      await expect(withLocale(props, mockHandler)).rejects.toThrow('Handler failed');
    });

    it('should pass through additional params', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ 
          locale: 'en', 
          slug: 'test-slug',
          id: '123'
        }),
        searchParams: Promise.resolve({ 
          brand: 'toyota',
          year: '2020'
        }),
      };

      mockHandler.mockResolvedValue('Complex Component' as React.ReactNode);

      await withLocale(props, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith('en', props);
    });
  });

  describe('Type Safety', () => {
    it('should work with typed search params', async () => {
      interface SearchFilters {
        brand?: string;
        minYear?: number;
        maxYear?: number;
        locations?: string[];
      }

      const searchParams = Promise.resolve({
        brand: 'toyota',
        minYear: '2018',
        maxYear: '2022',
        locations: 'damascus,aleppo',
      });

      const result = await parseSearchParams<SearchFilters>(searchParams);

      // TypeScript should infer the correct type
      expect(result.brand).toBe('toyota');
      expect(result.minYear).toBe('2018'); // Note: parseSearchParams doesn't do type conversion
      expect(result.locations).toEqual(['damascus', 'aleppo']);
    });

    it('should work with LocalePageProps interface', async () => {
      const props: LocalePageProps = {
        params: Promise.resolve({ locale: 'en', id: '123' }),
        searchParams: Promise.resolve({ brand: 'toyota' }),
      };

      // This should compile without TypeScript errors
      const locale = await extractLocale(props.params);
      expect(locale).toBe('en');
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in search params', async () => {
      const searchParams = Promise.resolve({
        query: 'BMW X5 2020',
        location: 'Damascus, Syria',
        description: 'Car with "special" characters & symbols!',
      });

      const result = await parseSearchParams(searchParams);

      expect(result).toEqual({
        query: 'BMW X5 2020',
        location: ['Damascus', 'Syria'], // parseSearchParams splits comma-separated values into arrays
        description: 'Car with "special" characters & symbols!',
      });
    });

    it('should handle Arabic text in metadata', () => {
      const metadata = generateLocaleMetadata(
        'ar',
        'سيارات للبيع في سوريا',
        'ابحث عن سيارتك المثالية من آلاف الإعلانات المتاحة',
        '/ar/search'
      );

      expect(metadata.title).toBe('سيارات للبيع في سوريا');
      expect(metadata.description).toBe('ابحث عن سيارتك المثالية من آلاف الإعلانات المتاحة');
      expect(metadata.other?.['direction']).toBe('rtl');
    });

    it('should handle very long URLs in redirects', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('brand', 'mercedes-benz');
      searchParams.set('model', 'c-class-sedan-luxury-edition');
      searchParams.set('location', 'damascus-new-damascus-mezzeh');
      searchParams.set('features', 'leather,sunroof,navigation,bluetooth');

      const url = generateLocaleRedirect('ar', '/search/advanced', searchParams);
      
      expect(url).toContain('/ar/search/advanced');
      expect(url).toContain('brand=mercedes-benz');
      expect(url).toContain('features=leather%2Csunroof%2Cnavigation%2Cbluetooth');
    });
  });
});
