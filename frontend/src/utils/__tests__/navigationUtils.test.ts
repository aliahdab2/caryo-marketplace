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
    it('should create basic slugs correctly', () => {
      expect(createSlug('Toyota')).toBe('toyota');
      expect(createSlug('Honda Civic')).toBe('honda-civic');
      expect(createSlug('BMW X5')).toBe('bmw-x5');
    });

    it('should handle special characters', () => {
      expect(createSlug('Rolls-Royce')).toBe('rolls-royce');
      expect(createSlug('McLaren P1™')).toBe('mclaren-p1');
      expect(createSlug('Audi A4 (2023)')).toBe('audi-a4-2023');
    });

    it('should handle edge cases', () => {
      expect(createSlug('')).toBe('');
      expect(createSlug('   ')).toBe('');
      expect(createSlug('---')).toBe('');
      expect(createSlug('  Toyota  ')).toBe('toyota');
    });

    it('should handle invalid inputs', () => {
      expect(createSlug(null as unknown as string)).toBe('');
      expect(createSlug(undefined as unknown as string)).toBe('');
      expect(createSlug(123 as unknown as string)).toBe('');
    });

    it('should handle Arabic text', () => {
      expect(createSlug('تويوتا')).toBe('تويوتا');
      expect(createSlug('هوندا سيفيك')).toBe('هوندا-سيفيك');
    });
  });

  describe('createModelSlug', () => {
    it('should create compound model slugs correctly', () => {
      expect(createModelSlug('Toyota', 'Camry')).toBe('toyota-camry');
      expect(createModelSlug('Honda', 'Civic')).toBe('honda-civic');
      expect(createModelSlug('BMW', 'X5')).toBe('bmw-x5');
    });

    it('should handle brands and models with spaces', () => {
      expect(createModelSlug('Land Rover', 'Range Rover')).toBe('land-rover-range-rover');
      expect(createModelSlug('Rolls Royce', 'Phantom')).toBe('rolls-royce-phantom');
    });

    it('should handle invalid inputs', () => {
      expect(createModelSlug('', 'Camry')).toBe('');
      expect(createModelSlug('Toyota', '')).toBe('');
      expect(createModelSlug('', '')).toBe('');
      expect(createModelSlug(null as unknown as string, 'Camry')).toBe('');
    });

    it('should handle Arabic text', () => {
      expect(createModelSlug('تويوتا', 'كامري')).toBe('تويوتا-كامري');
      expect(createModelSlug('هوندا', 'سيفيك')).toBe('هوندا-سيفيك');
    });
  });

  describe('buildBrandSearchUrl', () => {
    it('should build brand search URLs correctly', () => {
      expect(buildBrandSearchUrl('Toyota')).toBe('/search?brand=toyota');
      expect(buildBrandSearchUrl('Land Rover')).toBe('/search?brand=land-rover');
    });

    it('should handle invalid brand names', () => {
      expect(buildBrandSearchUrl('')).toBe('/search');
      expect(buildBrandSearchUrl(null as unknown as string)).toBe('/search');
    });

    it('should URL encode properly', () => {
      expect(buildBrandSearchUrl('Rolls-Royce')).toBe('/search?brand=rolls-royce');
      expect(buildBrandSearchUrl('McLaren P1™')).toBe('/search?brand=mclaren-p1');
    });
  });

  describe('buildModelSearchUrl', () => {
    it('should build model search URLs correctly', () => {
      expect(buildModelSearchUrl('Toyota', 'Camry'))
        .toBe('/search?brand=toyota&model=toyota-camry');
      expect(buildModelSearchUrl('Honda', 'Civic'))
        .toBe('/search?brand=honda&model=honda-civic');
    });

    it('should handle invalid inputs', () => {
      expect(buildModelSearchUrl('', 'Camry')).toBe('/search');
      expect(buildModelSearchUrl('Toyota', '')).toBe('/search');
      expect(buildModelSearchUrl('', '')).toBe('/search');
    });

    it('should URL encode properly', () => {
      expect(buildModelSearchUrl('Land Rover', 'Range Rover'))
        .toBe('/search?brand=land-rover&model=land-rover-range-rover');
    });
  });

  describe('NAVIGATION_ROUTES', () => {
    it('should contain all expected routes', () => {
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
    it('should validate known routes correctly', () => {
      expect(isValidNavigationRoute('/')).toBe(true);
      expect(isValidNavigationRoute('/search')).toBe(true);
      expect(isValidNavigationRoute('/dashboard')).toBe(true);
      expect(isValidNavigationRoute('/auth/signin')).toBe(true);
    });

    it('should reject unknown routes', () => {
      expect(isValidNavigationRoute('/unknown')).toBe(false);
      expect(isValidNavigationRoute('/listings/123')).toBe(false);
      expect(isValidNavigationRoute('')).toBe(false);
      expect(isValidNavigationRoute('invalid')).toBe(false);
    });
  });
});
