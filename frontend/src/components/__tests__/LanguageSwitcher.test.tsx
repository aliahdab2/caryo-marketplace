import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';
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

describe('LanguageSwitcher', () => {
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

  it('renders language switcher button', () => {
    render(<LanguageSwitcher />);
    
    expect(screen.getByLabelText('selectLanguage')).toBeInTheDocument();
    // Look for the SVG icon instead of a testid
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    expect(screen.getAllByText('languages.english')[0]).toBeInTheDocument();
    expect(screen.getAllByText('languages.arabic')[0]).toBeInTheDocument();
  });

  it('handles language change to English', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    const englishButton = screen.getAllByText('languages.english')[0];
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

    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    const arabicButton = screen.getAllByText('languages.arabic')[0];
    fireEvent.click(arabicButton);
    
    await waitFor(() => {
      expect(mockSetLanguageManually).toHaveBeenCalledWith('ar');
      expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
    });
  });

  it('sets cookie when language is changed', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    const englishButton = screen.getAllByText('languages.english')[0];
    fireEvent.click(englishButton);
    
    await waitFor(() => {
      expect(document.cookie).toContain('NEXT_LOCALE=en');
    });
  });

  it('handles keyboard navigation', () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    
    // Open dropdown with arrow down
    fireEvent.keyDown(button, { key: 'ArrowDown' });
    
    expect(screen.getAllByText('languages.english')[0]).toBeInTheDocument();
  });

  it('handles escape key to close dropdown', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    expect(screen.getAllByText('languages.english')[0]).toBeInTheDocument();
    
    fireEvent.keyDown(button, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('languages.english')).not.toBeInTheDocument();
    });
  });

  it('does not change language if same language is selected', async () => {
    render(<LanguageSwitcher />);
    
    const button = screen.getByLabelText('selectLanguage');
    fireEvent.click(button);
    
    const arabicButton = screen.getAllByText('languages.arabic')[0];
    fireEvent.click(arabicButton);
    
    await waitFor(() => {
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    render(<LanguageSwitcher className="custom-class" />);
    
    const container = screen.getByLabelText('selectLanguage').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });
}); 