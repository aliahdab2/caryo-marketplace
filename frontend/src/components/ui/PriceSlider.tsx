"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageDirection } from '@/utils/languageDirection';
import RangeSlider from './RangeSlider';
import { DEFAULT_CURRENCY, getOptimalLocale } from '../../utils/currency';
import { formatNumber } from '../../utils/localization';
import { PRICE_SLIDER_DEFAULTS, SLIDER_CLASSES, INPUT_CLASSES } from './PriceSlider.constants';
import type { PriceSliderProps } from '../../types/ui';

/**
 * Currency Input Component for Price Fields
 */
const CurrencyInput: React.FC<{
  ref: React.RefObject<HTMLInputElement>;
  id: string;
  defaultValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  placeholder: string;
  disabled: boolean;
  className: string;
  style: React.CSSProperties;
  step: number;
  min?: number;
  max?: number;
  currency: string;
}> = React.forwardRef<HTMLInputElement, any>(({
  id,
  defaultValue,
  onChange,
  onBlur,
  placeholder,
  disabled,
  className,
  style,
  step,
  min,
  max,
  currency
}, ref) => {
  const { dir } = useLanguageDirection();
  const isRTL = dir === 'rtl';
  
  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type="number"
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        style={style}
        step={step}
        min={min}
        max={max}
      />
      {/* Currency display */}
      <div className={`absolute top-1/2 transform -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
        <span className="text-gray-600 font-medium">{currency}</span>
      </div>
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

/**
 * Price-specific implementation of RangeSlider
 * Handles currency formatting and price-specific defaults
 * 
 * @component
 * @example
 * <PriceSlider
 *   minPrice={1000}
 *   maxPrice={50000}
 *   onChange={(min, max) => console.log(min, max)}
 *   currency="USD"
 * />
 */
const PriceSlider: React.FC<PriceSliderProps> = React.memo(({
  minPrice,
  maxPrice,
  minRange = PRICE_SLIDER_DEFAULTS.MIN_RANGE,
  maxRange = PRICE_SLIDER_DEFAULTS.MAX_RANGE,
  step = PRICE_SLIDER_DEFAULTS.STEP,
  currency = DEFAULT_CURRENCY,
  onChange,
  className = '',
  showInputs = true,
  t,
  locale
}) => {
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language || 'en-US';

  // Enhanced prop validation with console warnings in development or test
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (minRange >= maxRange) {
        console.warn('PriceSlider: minRange should be less than maxRange');
      }
      if (step <= 0) {
        console.warn('PriceSlider: step should be greater than 0');
      }
      if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
        console.warn('PriceSlider: minPrice should not be greater than maxPrice');
      }
    }
  }, [minRange, maxRange, step, minPrice, maxPrice]);

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

  // Get translated labels with proper namespace
  const minLabel = t ? t('search:lowestPrice', 'Lowest price') : 'Lowest price';
  const maxLabel = t ? t('search:highestPrice', 'Highest price') : 'Highest price';
  const anyPlaceholder = t ? t('search:any', 'Any') : 'Any';
  
  // Placeholders: "0" for min, highest price for max
  const minPlaceholder = "0";
  const maxPlaceholder = maxRange.toLocaleString();
  
  const ariaLabelMin = t ? t('search:minimumPrice', 'Minimum price') : 'Minimum price';
  const ariaLabelMax = t ? t('search:maximumPrice', 'Maximum price') : 'Maximum price';

  return (
    <RangeSlider
      minValue={minPrice}
      maxValue={maxPrice}
      minRange={minRange}
      maxRange={maxRange}
      step={step}
      onChange={onChange}
      className={`price-slider ${className}`}
      showInputs={showInputs}
      formatValue={formatValue}
      locale={currentLocale}
      minLabel={minLabel}
      maxLabel={maxLabel}
      anyPlaceholder={anyPlaceholder}
      minPlaceholder={minPlaceholder}
      maxPlaceholder={maxPlaceholder}
      ariaLabelMin={ariaLabelMin}
      ariaLabelMax={ariaLabelMax}
      unit={currency}
    />
  );
});

PriceSlider.displayName = 'PriceSlider';

export default PriceSlider;
