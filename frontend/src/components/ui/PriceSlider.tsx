"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import RangeSlider from './RangeSlider';
import { DEFAULT_CURRENCY, getOptimalLocale } from '../../utils/currency';
import { formatNumber } from '../../utils/localization';
import type { PriceSliderProps } from '../../types/ui';

/**
 * Price-specific implementation of RangeSlider
 * Handles currency formatting and price-specific defaults
 */
const PriceSlider: React.FC<PriceSliderProps> = React.memo(({
  minPrice,
  maxPrice,
  minRange = 0,
  maxRange = 150000,
  step = 500,
  currency = DEFAULT_CURRENCY,
  onChange,
  className = '',
  trackColor = 'bg-blue-500',
  thumbColor = 'bg-blue-600',
  showInputs = true,
  showLabels = true,
  t,
  locale
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language || 'en-US';

  // Validate props
  React.useEffect(() => {
    if (minRange >= maxRange) {
      console.warn('PriceSlider: minRange should be less than maxRange');
    }
  }, [minRange, maxRange]);

  // Format currency values
  const formatValue = React.useCallback((value: number) => {
    const formattingLocale = getOptimalLocale(currentLocale);
    
    return formatNumber(value, formattingLocale, { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [currency, currentLocale]);

  // Get translated labels
  const minLabel = t ? t('minPrice', 'Min Price') : 'Min Price';
  const maxLabel = t ? t('maxPrice', 'Max Price') : 'Max Price';
  const anyPlaceholder = t ? t('any', 'Any') : 'Any';
  const ariaLabelMin = t ? t('priceSlider.minPrice', 'Minimum price') : 'Minimum price';
  const ariaLabelMax = t ? t('priceSlider.maxPrice', 'Maximum price') : 'Maximum price';

  return (
    <RangeSlider
      minValue={minPrice}
      maxValue={maxPrice}
      minRange={minRange}
      maxRange={maxRange}
      step={step}
      onChange={onChange}
      className={`price-slider ${className}`}
      trackColor={trackColor}
      thumbColor={thumbColor}
      showInputs={showInputs}
      showLabels={showLabels}
      showRangeLabels={showLabels}
      formatValue={formatValue}
      locale={currentLocale}
      minLabel={minLabel}
      maxLabel={maxLabel}
      anyPlaceholder={anyPlaceholder}
      ariaLabelMin={ariaLabelMin}
      ariaLabelMax={ariaLabelMax}
    />
  );
});

PriceSlider.displayName = 'PriceSlider';

export default PriceSlider;
