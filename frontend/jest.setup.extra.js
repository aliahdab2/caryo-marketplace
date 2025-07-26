// jest.setup.js
// Mock Next.js components that cause issues in tests

// Mock the router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    locales: ['en'],
    locale: 'en',
    defaultLocale: 'en',
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the public environment variables that Next.js would normally inject
process.env = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

// Add window.matchMedia mock
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
  };
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    this.callback([{ isIntersecting: true }]);
    return null;
  }
  unobserve() { return null; }
  disconnect() { return null; }
}

window.IntersectionObserver = window.IntersectionObserver || MockIntersectionObserver;

// Mock fetch for API calls to prevent network errors in tests
global.fetch = jest.fn((url) => {
  // Mock different API endpoints
  if (url.includes('/api/reference-data')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        bodyStyles: [
          { id: 1, name: 'Sedan', displayNameEn: 'Sedan', displayNameAr: 'سيدان' },
          { id: 2, name: 'SUV', displayNameEn: 'SUV', displayNameAr: 'سيارة رياضية' },
          { id: 3, name: 'Hatchback', displayNameEn: 'Hatchback', displayNameAr: 'هاتشباك' }
        ],
        carConditions: [],
        driveTypes: [],
        fuelTypes: [],
        transmissions: [],
        sellerTypes: []
      })
    });
  }
  
  if (url.includes('/api/listings/count/filter')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ count: 0 })
    });
  }
  
  // Default mock for other fetch calls
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
});
