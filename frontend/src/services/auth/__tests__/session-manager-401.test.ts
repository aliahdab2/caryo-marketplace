/**
 * @jest-environment jsdom
 */
import { handleSessionExpired } from '../session-manager';
import { signOut } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('handleSessionExpired', () => {
  let originalLocation: Location;
  
  beforeEach(() => {
    // Save original location
    originalLocation = window.location;
    
    // Mock window.location
    delete (window as Window & { location?: Location }).location;
    window.location = {
      ...originalLocation,
      href: '',
      pathname: '/dashboard',
    } as Location;
    
    // Clear mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it('should call signOut with redirect: false', async () => {
    await handleSessionExpired();
    
    expect(signOut).toHaveBeenCalledWith({ redirect: false });
  });

  it('should redirect to signin with expired flag', async () => {
    window.location.pathname = '/dashboard';
    
    await handleSessionExpired();
    
    expect(window.location.href).toBe('/auth/signin?expired=true&returnUrl=%2Fdashboard');
  });

  it('should preserve current path in returnUrl', async () => {
    window.location.pathname = '/saved/alerts';
    
    await handleSessionExpired();
    
    expect(window.location.href).toBe('/auth/signin?expired=true&returnUrl=%2Fsaved%2Falerts');
  });

  it('should handle signOut errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (signOut as jest.Mock).mockRejectedValueOnce(new Error('SignOut failed'));
    
    await handleSessionExpired();
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('[AUTH] Error signing out:', expect.any(Error));
    expect(window.location.href).toBe('/auth/signin?expired=true&returnUrl=%2Fdashboard');
    
    consoleErrorSpy.mockRestore();
  });

  it('should log warning message', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await handleSessionExpired();
    
    expect(consoleWarnSpy).toHaveBeenCalledWith('[AUTH] Session expired, redirecting to login');
    
    consoleWarnSpy.mockRestore();
  });

  it('should encode special characters in returnUrl', async () => {
    window.location.pathname = '/listings/123?filter=test&sort=price';
    
    await handleSessionExpired();
    
    expect(window.location.href).toContain('returnUrl=%2Flistings%2F123%3Ffilter%3Dtest%26sort%3Dprice');
  });
});
