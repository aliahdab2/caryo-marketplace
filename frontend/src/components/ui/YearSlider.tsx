"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import RangeSlider from './RangeSlider';
import { formatNumber } from '../../utils/localization';
import type { TFunction } from 'i18next';

// Year slider defaults
const YEAR_SLIDER_DEFAULTS = {
  MIN_RANGE: 1920,
  MAX_RANGE: () => new Date().getFullYear(),
  STEP: 1
} as const;

export interface YearSliderProps {
  minYear?: number;
  maxYear?: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
  showInputs?: boolean;
  disabled?: boolean;
  t?: TFunction;
  locale?: string;
}

/**
 * Year-specific implementation of RangeSlider
 * Provides year-specific defaults, formatting, and translations
 */
const YearSlider: React.FC<YearSliderProps> = React.memo(({
  minYear,
  maxYear,
  minRange = YEAR_SLIDER_DEFAULTS.MIN_RANGE,
  maxRange = YEAR_SLIDER_DEFAULTS.MAX_RANGE(),
  step = YEAR_SLIDER_DEFAULTS.STEP,
  onChange,
  className = '',
  showInputs = true,
  disabled = false,
  t,
  locale
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language || 'en-US';

  // Enhanced prop validation in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (minRange >= maxRange) {
        console.warn('YearSlider: minRange should be less than maxRange');
      }
      if (step <= 0) {
        console.warn('YearSlider: step should be greater than 0');
      }
      if (minYear !== undefined && maxYear !== undefined && minYear > maxYear) {
        console.warn('YearSlider: minYear should not be greater than maxYear');
      }
    }
  }, [minRange, maxRange, step, minYear, maxYear]);

  // Format year values (no decimal places, no thousands separators)
  const formatValue = React.useCallback((value: number) => {
    return formatNumber(value, currentLocale, { 
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: false  // This removes thousands separators (commas)
    });
  }, [currentLocale]);

  // Get translated labels with proper namespace
  const minLabel = t ? t('search:from', 'From') : 'From';
  const maxLabel = t ? t('search:to', 'To') : 'To';
  const anyPlaceholder = t ? t('search:any', 'Any') : 'Any';
  
  // Placeholders: min year for min, max year for max
  const minPlaceholder = minRange.toString();
  const maxPlaceholder = maxRange.toString();
  
  const ariaLabelMin = t ? t('search:minimumYear', 'Minimum year') : 'Minimum year';
  const ariaLabelMax = t ? t('search:maximumYear', 'Maximum year') : 'Maximum year';

  return (
    <RangeSlider
      minValue={minYear}
      maxValue={maxYear}
      minRange={minRange}
      maxRange={maxRange}
      step={step}
      onChange={onChange}
      className={className}
      showInputs={showInputs}
      disabled={disabled}
      formatValue={formatValue}
      locale={currentLocale}
      minLabel={minLabel}
      maxLabel={maxLabel}
      anyPlaceholder={anyPlaceholder}
      minPlaceholder={minPlaceholder}
      maxPlaceholder={maxPlaceholder}
      ariaLabelMin={ariaLabelMin}
      ariaLabelMax={ariaLabelMax}
    />
  );
});

YearSlider.displayName = 'YearSlider';

export default YearSlider;
