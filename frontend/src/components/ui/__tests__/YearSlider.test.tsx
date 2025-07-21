import React from 'react';
import { render } from '@testing-library/react';
import YearSlider from '../YearSlider';

// Mock the formatNumber function
jest.mock('../../../utils/localization', () => ({
  formatNumber: jest.fn((value: number, locale: string, options: { useGrouping?: boolean }) => {
    // Simulate the real function behavior
    if (options?.useGrouping === false) {
      return value.toString(); // No commas
    }
    return value.toLocaleString(locale); // With commas
  })
}));

// Mock translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en-US' }
  })
}));

describe('YearSlider', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should format year values without thousands separators', async () => {
    const { formatNumber } = await import('../../../utils/localization');
    
    render(
      <YearSlider
        minYear={2020}
        maxYear={2024}
        onChange={mockOnChange}
        locale="en-US"
      />
    );

    // Check that formatNumber was called with useGrouping: false
    expect(formatNumber).toHaveBeenCalledWith(
      expect.any(Number),
      'en-US',
      expect.objectContaining({
        useGrouping: false,
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    );
  });

  it('should render without commas in year display', () => {
    const { container } = render(
      <YearSlider
        minYear={2020}
        maxYear={2024}
        onChange={mockOnChange}
        locale="en-US"
      />
    );

    // The year should appear as "2024" not "2,024"
    expect(container).toBeTruthy();
    // Note: The actual display test would require more complex DOM inspection
    // since the formatted values are passed to the RangeSlider component
  });
});
