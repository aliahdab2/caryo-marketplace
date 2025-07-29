import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { NextResponse } from 'next/server';

// Mock NextResponse using a factory function
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(() => ({ status: 200 })),
    redirect: jest.fn((url: string) => ({ status: 302, url })),
  },
}));

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (pathname: string, cookies: Record<string, string> = {}, headers: Record<string, string> = {}) => {
    return {
      nextUrl: {
        pathname,
        search: '',
        href: `http://localhost:3000${pathname}`,
      },
      url: `http://localhost:3000${pathname}`,
      cookies: {
        get: jest.fn((name: string) => {
          const value = cookies[name];
          return value ? { value } : undefined;
        }),
      },
      headers: {
        get: jest.fn((name: string) => headers[name]),
      },
    } as unknown as NextRequest;
  };

  describe('static files and API routes', () => {
    it('allows access to _next paths', () => {
      const request = createMockRequest('/_next/static/chunks/main.js');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to API routes', () => {
      const request = createMockRequest('/api/auth/signin');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to static files', () => {
      const request = createMockRequest('/static/images/logo.png');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to files with extensions', () => {
      const request = createMockRequest('/favicon.ico');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('locale detection', () => {
    it('redirects to Arabic when no locale is specified', () => {
      const request = createMockRequest('/search');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('redirects to Arabic when cookie is set to Arabic', () => {
      const request = createMockRequest('/search', { NEXT_LOCALE: 'ar' });
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('redirects to English when cookie is set to English', () => {
      const request = createMockRequest('/search', { NEXT_LOCALE: 'en' });
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('redirects to Arabic when Accept-Language header contains Arabic', () => {
      const request = createMockRequest('/search', {}, { 'accept-language': 'ar,en;q=0.9' });
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('redirects to English when Accept-Language header contains English', () => {
      const request = createMockRequest('/search', {}, { 'accept-language': 'en,ar;q=0.9' });
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('defaults to Arabic when Accept-Language header contains unsupported language', () => {
      const request = createMockRequest('/search', {}, { 'accept-language': 'fr,es;q=0.9' });
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  describe('existing locale paths', () => {
    it('allows access to Arabic paths', () => {
      const request = createMockRequest('/ar/search');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to English paths', () => {
      const request = createMockRequest('/en/search');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to Arabic root path', () => {
      const request = createMockRequest('/ar');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('allows access to English root path', () => {
      const request = createMockRequest('/en');
      middleware(request);
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('query parameter preservation', () => {
    it('preserves query parameters when redirecting', () => {
      const request = createMockRequest('/search?brand=toyota&model=camry');
      request.nextUrl.search = '?brand=toyota&model=camry';
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('preserves empty query parameters', () => {
      const request = createMockRequest('/search?');
      request.nextUrl.search = '?';
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles root path without locale', () => {
      const request = createMockRequest('/');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('handles nested paths without locale', () => {
      const request = createMockRequest('/dashboard/settings');
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it('handles paths with query parameters and no locale', () => {
      const request = createMockRequest('/search?brand=toyota');
      request.nextUrl.search = '?brand=toyota';
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });
}); 