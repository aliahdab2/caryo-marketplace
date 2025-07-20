"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import RangeSlider from './RangeSlider';
import { formatNumber } from '../../utils/localization';
import type { TFunction } from 'i18next';

// Mileage slider defaults
const MILEAGE_SLIDER_DEFAULTS = {
  MIN_RANGE: 0,
  MAX_RANGE: 500000,
  STEP: 5000,
  UNIT: 'km'
} as const;

export interface MileageSliderProps {
  minMileage?: number;
  maxMileage?: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  unit?: string;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
  showInputs?: boolean;
  disabled?: boolean;
  t?: TFunction;
  locale?: string;
}

/**
 * Mileage-specific implementation of RangeSlider
 * Provides mileage-specific defaults, formatting, and translations
 */
const MileageSlider: React.FC<MileageSliderProps> = React.memo(({
  minMileage,
  maxMileage,
  minRange = MILEAGE_SLIDER_DEFAULTS.MIN_RANGE,
  maxRange = MILEAGE_SLIDER_DEFAULTS.MAX_RANGE,
  step = MILEAGE_SLIDER_DEFAULTS.STEP,
  unit = MILEAGE_SLIDER_DEFAULTS.UNIT,
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
        console.warn('MileageSlider: minRange should be less than maxRange');
      }
      if (step <= 0) {
        console.warn('MileageSlider: step should be greater than 0');
      }
      if (minMileage !== undefined && maxMileage !== undefined && minMileage > maxMileage) {
        console.warn('MileageSlider: minMileage should not be greater than maxMileage');
      }
    }
  }, [minRange, maxRange, step, minMileage, maxMileage]);

  // Format mileage values
  const formatValue = React.useCallback((value: number) => {
    return formatNumber(value, currentLocale, { 
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [currentLocale]);

  // Get translated labels with proper namespace
  const minLabel = t ? t('search:lowestMileage', 'Lowest mileage') : 'Lowest mileage';
  const maxLabel = t ? t('search:highestMileage', 'Highest mileage') : 'Highest mileage';
  const anyPlaceholder = t ? t('search:any', 'Any') : 'Any';
  
  // Placeholders: formatted "0" for min, highest mileage for max
  const minPlaceholder = formatValue(0);
  const maxPlaceholder = formatValue(maxRange);
  
  const ariaLabelMin = t ? t('search:minimumMileage', 'Minimum mileage') : 'Minimum mileage';
  const ariaLabelMax = t ? t('search:maximumMileage', 'Maximum mileage') : 'Maximum mileage';

  return (
    <RangeSlider
      minValue={minMileage}
      maxValue={maxMileage}
      minRange={minRange}
      maxRange={maxRange}
      step={step}
      unit={unit}
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

MileageSlider.displayName = 'MileageSlider';

export default MileageSlider;
