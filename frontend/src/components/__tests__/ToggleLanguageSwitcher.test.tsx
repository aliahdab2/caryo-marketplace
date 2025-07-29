import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToggleLanguageSwitcher from '../ToggleLanguageSwitcher';
import { useLanguage } from '@/components/EnhancedLanguageProvider';
import { useManualLanguageOverride } from '@/hooks/useAutomaticLanguageDetection';

// Mock the hooks
jest.mock('@/components/EnhancedLanguageProvider', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('@/hooks/useAutomaticLanguageDetection', () => ({
  useManualLanguageOverride: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/ar/dashboard',
}));

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;
const mockUseManualLanguageOverride = useManualLanguageOverride as jest.MockedFunction<typeof useManualLanguageOverride>;

describe('ToggleLanguageSwitcher', () => {
  const mockChangeLanguage = jest.fn();
  const mockSetLanguageManually = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseLanguage.mockReturnValue({
      locale: 'ar',
      changeLanguage: mockChangeLanguage,
      direction: {
        dir: 'rtl',
        isRTL: true,
        dirClass: 'text-right',
        flexClass: 'flex-row-reverse',
        reverseFlexClass: 'flex-row',
      },
      isRTL: true,
      isReady: true,
      preloadLanguage: jest.fn(),
    });

    mockUseManualLanguageOverride.mockReturnValue({
      setLanguageManually: mockSetLanguageManually,
    });

    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('renders both language options', () => {
    render(<ToggleLanguageSwitcher />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
  });

  it('shows Arabic as active when locale is Arabic', () => {
    render(<ToggleLanguageSwitcher />);
    
    const arabicButton = screen.getByText('العربية');
    const englishButton = screen.getByText('English');
    
    // Check that Arabic button has active styling (underline)
    expect(arabicButton.closest('button')).toHaveClass('text-gray-900');
    expect(englishButton.closest('button')).toHaveClass('text-gray-600');
  });

  it('shows English as active when locale is English', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'en',
      changeLanguage: mockChangeLanguage,
      direction: {
        dir: 'ltr',
        isRTL: false,
        dirClass: 'text-left',
        flexClass: 'flex-row',
        reverseFlexClass: 'flex-row-reverse',
      },
      isRTL: false,
      isReady: true,
      preloadLanguage: jest.fn(),
    });

    render(<ToggleLanguageSwitcher />);
    
    const arabicButton = screen.getByText('العربية');
    const englishButton = screen.getByText('English');
    
    // Check that English button has active styling (underline)
    expect(englishButton.closest('button')).toHaveClass('text-gray-900');
    expect(arabicButton.closest('button')).toHaveClass('text-gray-600');
  });

  it('handles language change to English', async () => {
    render(<ToggleLanguageSwitcher />);
    
    const englishButton = screen.getByText('English');
    fireEvent.click(englishButton);
    
    await waitFor(() => {
      expect(mockSetLanguageManually).toHaveBeenCalledWith('en');
      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });
  });

  it('handles language change to Arabic', async () => {
    mockUseLanguage.mockReturnValue({
      locale: 'en',
      changeLanguage: mockChangeLanguage,
      direction: {
        dir: 'ltr',
        isRTL: false,
        dirClass: 'text-left',
        flexClass: 'flex-row',
        reverseFlexClass: 'flex-row-reverse',
      },
      isRTL: false,
      isReady: true,
      preloadLanguage: jest.fn(),
    });

    render(<ToggleLanguageSwitcher />);
    
    const arabicButton = screen.getByText('العربية');
    fireEvent.click(arabicButton);
    
    await waitFor(() => {
      expect(mockSetLanguageManually).toHaveBeenCalledWith('ar');
      expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
    });
  });

  it('sets cookie when language is changed', async () => {
    render(<ToggleLanguageSwitcher />);
    
    const englishButton = screen.getByText('English');
    fireEvent.click(englishButton);
    
    await waitFor(() => {
      expect(document.cookie).toContain('NEXT_LOCALE=en');
    });
  });

  it('does not change language if same language is selected', async () => {
    render(<ToggleLanguageSwitcher />);
    
    const arabicButton = screen.getByText('العربية');
    fireEvent.click(arabicButton);
    
    await waitFor(() => {
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    render(<ToggleLanguageSwitcher className="custom-class" />);
    
    const container = screen.getByText('English').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<ToggleLanguageSwitcher />);
    
    const englishButton = screen.getByText('English');
    const arabicButton = screen.getByText('العربية');
    
    expect(englishButton).toHaveAttribute('aria-label', 'Switch to English');
    expect(arabicButton).toHaveAttribute('aria-label', 'Switch to Arabic');
  });

  it('handles error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the changeLanguage to throw an error
    const mockChangeLanguageWithError = jest.fn().mockImplementation(() => {
      throw new Error('Language change failed');
    });
    
    mockUseLanguage.mockReturnValue({
      locale: 'ar',
      changeLanguage: mockChangeLanguageWithError,
      direction: {
        dir: 'rtl',
        isRTL: true,
        dirClass: 'text-right',
        flexClass: 'flex-row-reverse',
        reverseFlexClass: 'flex-row',
      },
      isRTL: true,
      isReady: true,
      preloadLanguage: jest.fn(),
    });

    render(<ToggleLanguageSwitcher />);
    
    const englishButton = screen.getByText('English');
    fireEvent.click(englishButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to switch language:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
}); 