"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CURRENCY, getOptimalLocale } from '../../utils/currency';
import { formatNumber } from '../../utils/localization';
import type { PriceSliderProps } from '../../types/ui';

/**
 * Interactive dual-range price slider component with touch/mouse support
 * Features: visual feedback, keyboard navigation, accessibility, and customizable styling
 * Supports bilingual formatting for English and Arabic locales
 * 
 * @param minPrice - Initial minimum price value
 * @param maxPrice - Initial maximum price value  
 * @param minRange - Slider minimum boundary (default: 0)
 * @param maxRange - Slider maximum boundary (default: 150000)
 * @param step - Price increment step (default: 1000)
 * @param currency - Currency code for formatting (default: DEFAULT_CURRENCY)
 * @param onChange - Callback fired when price range changes
 * @param t - Translation function for i18n support
 * @param locale - Locale for currency/number formatting. When undefined, automatically detects from i18n context (i18n.language) with fallback to 'en-US'. Supports Syrian marketplace locales (ar-SY, en-US)
 * @param className - Additional CSS classes
 * @param trackColor - Custom track color (default: 'bg-blue-500')
 * @param thumbColor - Custom thumb color (default: 'bg-blue-600')
 * @param showInputs - Show manual input fields (default: true)
 * @param showLabels - Show range labels (default: true)
 */
const PriceSlider: React.FC<PriceSliderProps> = React.memo(({
  minPrice,
  maxPrice,
  minRange = 0,
  maxRange = 150000,
  step = 1000,
  currency = DEFAULT_CURRENCY,
  onChange,
  className = '',
  trackColor = 'bg-blue-500',
  thumbColor = 'bg-blue-600',
  showInputs = true,
  showLabels = true,
  t = (key: string, fallback: string) => fallback,
  locale
}) => {
  // Auto-detect locale from i18n context if not provided
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language || 'en-US';
  
  // Validate props
  if (minRange >= maxRange) {
    console.warn('PriceSlider: minRange should be less than maxRange');
  }
  if (step <= 0) {
    console.warn('PriceSlider: step should be greater than 0');
  }

  // Internal state for the slider values - initialize once from props with validation
  const [minVal, setMinVal] = useState(() => {
    const initial = minPrice || minRange;
    return Math.max(minRange, Math.min(initial, maxRange - step));
  });
  const [maxVal, setMaxVal] = useState(() => {
    const initial = maxPrice || maxRange;
    return Math.min(maxRange, Math.max(initial, minRange + step));
  });
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Add flag to prevent external updates during critical state changes
  const isUpdatingRef = useRef(false);
  // Store the last values we sent to parent to avoid feedback loops
  const lastSentValuesRef = useRef<{ min?: number; max?: number }>({});
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Prevent external prop updates from interfering during dragging or immediate post-drag
  useEffect(() => {
    if (isDragging || isUpdatingRef.current) return;
    
    // Only update from props if the values are significantly different from what we have
    // and they're not the same as what we just sent to the parent (to prevent feedback loops)
    const normalizeValue = (val: number | undefined, defaultVal: number) => val || defaultVal;
    const propsMin = normalizeValue(minPrice, minRange);
    const propsMax = normalizeValue(maxPrice, maxRange);
    
    const lastSentMin = lastSentValuesRef.current.min || minRange;
    const lastSentMax = lastSentValuesRef.current.max || maxRange;
    
    // Only update if props are different from current state AND different from last sent values
    const shouldUpdateMin = Math.abs(propsMin - minVal) > step/2 && Math.abs(propsMin - lastSentMin) > step/2;
    const shouldUpdateMax = Math.abs(propsMax - maxVal) > step/2 && Math.abs(propsMax - lastSentMax) > step/2;
    
    if (shouldUpdateMin || shouldUpdateMax) {
      if (shouldUpdateMin) {
        const validMinPrice = Math.max(minRange, Math.min(propsMin, maxRange - step));
        setMinVal(validMinPrice);
      }
      if (shouldUpdateMax) {
        const validMaxPrice = Math.min(maxRange, Math.max(propsMax, minRange + step));
        setMaxVal(validMaxPrice);
      }
      
      // Reset user interaction flag since this is an external update
      setHasUserInteracted(false);
    }
  }, [minPrice, maxPrice, minRange, maxRange, step, isDragging, minVal, maxVal]);

  // Calculate percentage for positioning
  const getPercent = useCallback((value: number) => {
    return ((value - minRange) / (maxRange - minRange)) * 100;
  }, [minRange, maxRange]);

  // Get value from percentage
  const getValueFromPercent = useCallback((percent: number) => {
    const value = (percent / 100) * (maxRange - minRange) + minRange;
    return Math.round(value / step) * step;
  }, [minRange, maxRange, step]);

  // Update visual positions of thumbs and track
  const updatePositions = useCallback(() => {
    // Use requestAnimationFrame for smoother visual updates
    requestAnimationFrame(() => {
      if (!minThumbRef.current || !maxThumbRef.current || !trackRef.current) return;

      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);

      // Update positions atomically to prevent visual glitches
      const minThumb = minThumbRef.current;
      const maxThumb = maxThumbRef.current;
      const track = trackRef.current;

      minThumb.style.left = `${minPercent}%`;
      maxThumb.style.left = `${maxPercent}%`;
      track.style.left = `${minPercent}%`;
      track.style.width = `${maxPercent - minPercent}%`;
    });
  }, [minVal, maxVal, getPercent]);

  // Handle mouse/touch down on thumbs
  const handleMouseDown = useCallback((type: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Clear any pending updates
    isUpdatingRef.current = false;
    
    setIsDragging(type);
    setHasUserInteracted(true);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((type: 'min' | 'max') => (e: React.KeyboardEvent) => {
    const currentVal = type === 'min' ? minVal : maxVal;
    let newVal = currentVal;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newVal = currentVal - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newVal = currentVal + step;
        break;
      case 'Home':
        e.preventDefault();
        newVal = minRange;
        break;
      case 'End':
        e.preventDefault();
        newVal = maxRange;
        break;
      default:
        return;
    }

    setHasUserInteracted(true);
    
    if (type === 'min') {
      setMinVal(Math.max(minRange, Math.min(newVal, maxVal - step)));
    } else {
      setMaxVal(Math.min(maxRange, Math.max(newVal, minVal + step)));
    }
  }, [minVal, maxVal, step, minRange, maxRange]);

  // Handle mouse/touch move
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;

    // Prevent any external updates during move
    isUpdatingRef.current = true;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = getValueFromPercent(percent);

    // Update state and let the visual updates happen through updatePositions
    if (isDragging === 'min') {
      const newMin = Math.min(value, maxVal - step);
      const validMin = Math.max(minRange, newMin);
      setMinVal(validMin);
    } else {
      const newMax = Math.max(value, minVal + step);
      const validMax = Math.min(maxRange, newMax);
      setMaxVal(validMax);
    }
  }, [isDragging, maxVal, minVal, step, minRange, maxRange, getValueFromPercent]);

  // Handle mouse/touch up
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    // Set updating flag to prevent external interference
    isUpdatingRef.current = true;
    
    setIsDragging(null);
    
    // Call onChange immediately with current values, then clean up
    if (hasUserInteracted) {
      const currentMin = minVal === minRange ? undefined : minVal;
      const currentMax = maxVal === maxRange ? undefined : maxVal;
      
      // Store the values we're sending to prevent feedback loops
      lastSentValuesRef.current = {
        min: currentMin || minRange,
        max: currentMax || maxRange
      };
      
      onChange(currentMin, currentMax);
    }
    
    // Clean up the updating flag after a brief moment
    setTimeout(() => {
      isUpdatingRef.current = false;
      updatePositions(); // Ensure final position is correct
    }, 100); // Increased timeout to give parent more time to process
  }, [isDragging, minVal, maxVal, minRange, maxRange, hasUserInteracted, onChange, updatePositions]);

  // Handle click on slider track
  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || isUpdatingRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const value = getValueFromPercent(percent);

    setHasUserInteracted(true);

    // Move the closest thumb
    const minDistance = Math.abs(value - minVal);
    const maxDistance = Math.abs(value - maxVal);

    if (minDistance <= maxDistance) {
      const newMinVal = Math.max(minRange, Math.min(value, maxVal - step));
      setMinVal(newMinVal);
    } else {
      const newMaxVal = Math.min(maxRange, Math.max(value, minVal + step));
      setMaxVal(newMaxVal);
    }
  }, [isDragging, minVal, maxVal, step, minRange, maxRange, getValueFromPercent]);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove);
      document.addEventListener('touchend', handleUp);

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Update positions when values change
  useEffect(() => {
    updatePositions();
  }, [updatePositions]);

  // Notify parent of changes - ONLY for non-dragging interactions (keyboard, input fields, clicks)
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    // Only notify for non-dragging interactions to avoid conflicts with handleMouseUp
    // Note: Don't block input field changes with isUpdatingRef check since those are direct user interactions
    if (!hasUserInteracted || isDragging) return;

    // This handles keyboard navigation, input field changes, and slider clicks
    const currentMin = minVal === minRange ? undefined : minVal;
    const currentMax = maxVal === maxRange ? undefined : maxVal;
    
    // Store the values we're sending to prevent feedback loops
    lastSentValuesRef.current = {
      min: currentMin || minRange,
      max: currentMax || maxRange
    };
    
    onChangeRef.current(currentMin, currentMax);
  }, [minVal, maxVal, minRange, maxRange, hasUserInteracted, isDragging]);

  /**
   * Formats currency values with proper locale support for bilingual display
   * Maps language codes to appropriate locale strings for number formatting
   */
  const formatValue = useCallback((value: number) => {
    // Use the standardized locale optimization function
    const formattingLocale = getOptimalLocale(currentLocale);
    
    return formatNumber(value, formattingLocale, { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [currency, currentLocale]);

  return (
    <div className={`price-slider ${className}`}>
      {/* Value Display */}
      {showLabels && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(minVal)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(maxVal)}
            </div>
          </div>
        </div>
      )}

      {/* Slider */}
      <div className="relative px-2 py-6">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleSliderClick}
        >
          {/* Active track */}
          <div
            ref={trackRef}
            className={`absolute h-2 ${trackColor} rounded-full`}
          />

          {/* Min thumb */}
          <div
            ref={minThumbRef}
            className={`absolute w-6 h-6 ${thumbColor} border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
              isDragging === 'min' ? 'scale-110 ring-4 ring-blue-200' : ''
            }`}
            onMouseDown={handleMouseDown('min')}
            onTouchStart={handleMouseDown('min')}
            onKeyDown={handleKeyDown('min')}
            tabIndex={0}
            role="slider"
            aria-label={t('minimumPrice', 'Minimum price')}
            aria-valuemin={minRange}
            aria-valuemax={maxVal - step}
            aria-valuenow={minVal}
            aria-valuetext={formatValue(minVal)}
          />

          {/* Max thumb */}
          <div
            ref={maxThumbRef}
            className={`absolute w-6 h-6 ${thumbColor} border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
              isDragging === 'max' ? 'scale-110 ring-4 ring-blue-200' : ''
            }`}
            onMouseDown={handleMouseDown('max')}
            onTouchStart={handleMouseDown('max')}
            onKeyDown={handleKeyDown('max')}
            tabIndex={0}
            role="slider"
            aria-label={t('maximumPrice', 'Maximum price')}
            aria-valuemin={minVal + step}
            aria-valuemax={maxRange}
            aria-valuenow={maxVal}
            aria-valuetext={formatValue(maxVal)}
          />
        </div>

        {/* Range labels */}
        {showLabels && (
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <span>{formatValue(minRange)}</span>
            <span>{formatValue(maxRange)}</span>
          </div>
        )}
      </div>

      {/* Input fields */}
      {showInputs && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label htmlFor="min-price-input" className="block text-sm text-gray-600 mb-2">
              {t('minPrice', 'Min Price')}
            </label>
            <input
              id="min-price-input"
              type="number"
              value={minVal === minRange ? '' : minVal}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : minRange;
                setHasUserInteracted(true);
                const constrainedValue = Math.max(minRange, Math.min(value, maxVal - step));
                setMinVal(constrainedValue);
              }}
              placeholder={minVal === minRange ? t('any', 'Any') : formatValue(minRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step={step}
              min={minRange}
            />
          </div>
          <div>
            <label htmlFor="max-price-input" className="block text-sm text-gray-600 mb-2">
              {t('maxPrice', 'Max Price')}
            </label>
            <input
              id="max-price-input"
              type="number"
              value={maxVal === maxRange ? '' : maxVal}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : maxRange;
                setHasUserInteracted(true);
                setMaxVal(Math.min(maxRange, Math.max(value, minVal + step)));
              }}
              placeholder={maxVal === maxRange ? t('any', 'Any') : formatValue(maxRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step={step}
              min={minVal + step}
            />
          </div>
        </div>
      )}
    </div>
  );
});

PriceSlider.displayName = 'PriceSlider';

export default PriceSlider;
