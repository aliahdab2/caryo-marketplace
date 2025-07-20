import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceSlider from '../PriceSlider';

// Mock the utilities
jest.mock('../../../utils/currency', () => ({
  DEFAULT_CURRENCY: 'USD',
  getOptimalLocale: jest.fn((locale: string) => {
    if (locale.startsWith('ar')) return 'ar-SY';
    if (locale.startsWith('en')) return 'en-US';
    return locale;
  })
}));

jest.mock('../../../utils/localization', () => ({
  formatNumber: jest.fn((value: number, locale: string, options: { currency?: string; style?: string }) => {
    if (locale.startsWith('ar')) {
      return `٢٥٬٠٠٠ ${options.currency === 'USD' ? '$' : 'ل.س.'}`;
    }
    return `${options.currency === 'USD' ? '$' : 'SYP '}25,000`;
  })
}));

// Mock react-i18next
const mockUseTranslation = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation()
}));

describe('PriceSlider Locale Auto-Detection', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should auto-detect English locale from i18n context', () => {
    // Mock English i18n context
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'en' }
    });
    
    render(
      <PriceSlider
        minPrice={10000}
        maxPrice={25000}
        onChange={mockOnChange}
      />
    );

    // Should format numbers using English locale (check aria-valuetext)
    expect(screen.getByRole('slider', { name: /minimum price/i })).toHaveAttribute('aria-valuetext', '$25,000');
  });

  test('should auto-detect Arabic locale from i18n context', () => {
    // Mock Arabic i18n context
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'ar' }
    });
    
    render(
      <PriceSlider
        minPrice={10000}
        maxPrice={25000}
        onChange={mockOnChange}
      />
    );

    // Should format numbers using Arabic locale with Arabic numerals (check aria-valuetext)
    expect(screen.getByRole('slider', { name: /minimum price/i })).toHaveAttribute('aria-valuetext', '٢٥٬٠٠٠ $');
  });

  test('should allow manual locale override', () => {
    // Mock English i18n context
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'en' }
    });
    
    render(
      <PriceSlider
        minPrice={10000}
        maxPrice={25000}
        onChange={mockOnChange}
        locale="ar-SY" // Manual override to Arabic (Syria)
      />
    );

    // Should use the manually specified Arabic locale despite English i18n context (check aria-valuetext)
    expect(screen.getByRole('slider', { name: /minimum price/i })).toHaveAttribute('aria-valuetext', '٢٥٬٠٠٠ $');
  });

  test('should fallback to en-US when i18n language is not available', () => {
    // Mock unsupported language
    mockUseTranslation.mockReturnValue({
      i18n: { language: 'fr' }
    });
    
    render(
      <PriceSlider
        minPrice={10000}
        maxPrice={25000}
        onChange={mockOnChange}
      />
    );

    // Should fallback to English formatting (check aria-valuetext)
    expect(screen.getByRole('slider', { name: /minimum price/i })).toHaveAttribute('aria-valuetext', '$25,000');
  });
});
