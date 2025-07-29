import {
  createSlug,
  createModelSlug,
  buildBrandSearchUrl,
  buildModelSearchUrl,
  NAVIGATION_ROUTES,
  isValidNavigationRoute
} from '../navigationUtils';

describe('navigationUtils', () => {
  describe('createSlug', () => {
    it('creates a valid slug from English text', () => {
      expect(createSlug('Toyota Camry')).toBe('toyota-camry');
      expect(createSlug('BMW X5')).toBe('bmw-x5');
      expect(createSlug('Mercedes-Benz')).toBe('mercedes-benz');
    });

    it('creates a valid slug from Arabic text', () => {
      expect(createSlug('تويوتا كامري')).toBe('تويوتا-كامري');
      expect(createSlug('بي إم دبليو إكس 5')).toBe('بي-إم-دبليو-إكس-5');
    });

    it('handles special characters and spaces', () => {
      expect(createSlug('Toyota & Camry')).toBe('toyota-camry');
      expect(createSlug('BMW (X5)')).toBe('bmw-x5');
      expect(createSlug('  Toyota   Camry  ')).toBe('toyota-camry');
    });

    it('handles empty or invalid input', () => {
      expect(createSlug('')).toBe('');
      expect(createSlug('   ')).toBe('');
      expect(createSlug(null as unknown as string)).toBe('');
      expect(createSlug(undefined as unknown as string)).toBe('');
    });

    it('removes leading and trailing dashes', () => {
      expect(createSlug('-Toyota-')).toBe('toyota');
      expect(createSlug('--BMW--')).toBe('bmw');
    });
  });

  describe('createModelSlug', () => {
    it('creates a compound model slug', () => {
      expect(createModelSlug('Toyota', 'Camry')).toBe('toyota-camry');
      expect(createModelSlug('BMW', 'X5')).toBe('bmw-x5');
    });

    it('handles empty or invalid input', () => {
      expect(createModelSlug('', 'Camry')).toBe('');
      expect(createModelSlug('Toyota', '')).toBe('');
      expect(createModelSlug('', '')).toBe('');
    });

    it('handles special characters in brand and model names', () => {
      expect(createModelSlug('Toyota & Co', 'Camry (2024)')).toBe('toyota-co-camry-2024');
    });
  });

  describe('buildBrandSearchUrl', () => {
    it('creates a brand search URL with default locale', () => {
      expect(buildBrandSearchUrl('Toyota')).toBe('/ar/search?brand=toyota');
      expect(buildBrandSearchUrl('BMW')).toBe('/ar/search?brand=bmw');
    });

    it('creates a brand search URL with specified locale', () => {
      expect(buildBrandSearchUrl('Toyota', 'en')).toBe('/en/search?brand=toyota');
      expect(buildBrandSearchUrl('BMW', 'ar')).toBe('/ar/search?brand=bmw');
    });

    it('handles empty or invalid brand names', () => {
      expect(buildBrandSearchUrl('')).toBe('/ar/search');
      expect(buildBrandSearchUrl('   ')).toBe('/ar/search');
    });

    it('URL encodes the brand slug', () => {
      expect(buildBrandSearchUrl('Toyota & Co')).toBe('/ar/search?brand=toyota-co');
    });
  });

  describe('buildModelSearchUrl', () => {
    it('creates a model search URL with default locale', () => {
      expect(buildModelSearchUrl('Toyota', 'Camry')).toBe('/ar/search?brand=toyota&model=toyota-camry');
      expect(buildModelSearchUrl('BMW', 'X5')).toBe('/ar/search?brand=bmw&model=bmw-x5');
    });

    it('creates a model search URL with specified locale', () => {
      expect(buildModelSearchUrl('Toyota', 'Camry', 'en')).toBe('/en/search?brand=toyota&model=toyota-camry');
      expect(buildModelSearchUrl('BMW', 'X5', 'ar')).toBe('/ar/search?brand=bmw&model=bmw-x5');
    });

    it('handles empty or invalid brand/model names', () => {
      expect(buildModelSearchUrl('', 'Camry')).toBe('/ar/search');
      expect(buildModelSearchUrl('Toyota', '')).toBe('/ar/search');
      expect(buildModelSearchUrl('', '')).toBe('/ar/search');
    });

    it('URL encodes the brand and model slugs', () => {
      expect(buildModelSearchUrl('Toyota & Co', 'Camry (2024)')).toBe('/ar/search?brand=toyota-co&model=toyota-co-camry-2024');
    });
  });

  describe('NAVIGATION_ROUTES', () => {
    it('contains all expected routes', () => {
      expect(NAVIGATION_ROUTES).toHaveProperty('HOME');
      expect(NAVIGATION_ROUTES).toHaveProperty('SEARCH');
      expect(NAVIGATION_ROUTES).toHaveProperty('LISTINGS');
      expect(NAVIGATION_ROUTES).toHaveProperty('FAVORITES');
      expect(NAVIGATION_ROUTES).toHaveProperty('DASHBOARD');
      expect(NAVIGATION_ROUTES).toHaveProperty('PROFILE');
      expect(NAVIGATION_ROUTES).toHaveProperty('SETTINGS');
      expect(NAVIGATION_ROUTES).toHaveProperty('CONTACT');
      expect(NAVIGATION_ROUTES).toHaveProperty('SIGNIN');
      expect(NAVIGATION_ROUTES).toHaveProperty('SIGNUP');
    });

    it('has correct route values', () => {
      expect(NAVIGATION_ROUTES.HOME).toBe('/');
      expect(NAVIGATION_ROUTES.SEARCH).toBe('/search');
      expect(NAVIGATION_ROUTES.LISTINGS).toBe('/listings');
      expect(NAVIGATION_ROUTES.FAVORITES).toBe('/favorites');
      expect(NAVIGATION_ROUTES.DASHBOARD).toBe('/dashboard');
      expect(NAVIGATION_ROUTES.PROFILE).toBe('/dashboard/profile');
      expect(NAVIGATION_ROUTES.SETTINGS).toBe('/dashboard/settings');
      expect(NAVIGATION_ROUTES.CONTACT).toBe('/contact');
      expect(NAVIGATION_ROUTES.SIGNIN).toBe('/auth/signin');
      expect(NAVIGATION_ROUTES.SIGNUP).toBe('/auth/signup');
    });
  });

  describe('isValidNavigationRoute', () => {
    it('returns true for valid navigation routes', () => {
      expect(isValidNavigationRoute('/')).toBe(true);
      expect(isValidNavigationRoute('/search')).toBe(true);
      expect(isValidNavigationRoute('/listings')).toBe(true);
      expect(isValidNavigationRoute('/favorites')).toBe(true);
      expect(isValidNavigationRoute('/dashboard')).toBe(true);
      expect(isValidNavigationRoute('/dashboard/profile')).toBe(true);
      expect(isValidNavigationRoute('/dashboard/settings')).toBe(true);
      expect(isValidNavigationRoute('/contact')).toBe(true);
      expect(isValidNavigationRoute('/auth/signin')).toBe(true);
      expect(isValidNavigationRoute('/auth/signup')).toBe(true);
    });

    it('returns false for invalid routes', () => {
      expect(isValidNavigationRoute('/invalid')).toBe(false);
      expect(isValidNavigationRoute('/dashboard/invalid')).toBe(false);
      expect(isValidNavigationRoute('/api/test')).toBe(false);
      expect(isValidNavigationRoute('')).toBe(false);
    });
  });
});
