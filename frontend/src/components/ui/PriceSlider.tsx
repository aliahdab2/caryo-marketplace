"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_CURRENCY } from '../../utils/currency';
import { formatNumber } from '../../utils/localization';
import type { PriceSliderProps } from '../../types/ui';

/**
 * Interactive dual-range price slider component with touch/mouse support
 * Features: visual feedback, keyboard navigation, accessibility, and customizable styling
 * 
 * @param minPrice - Initial minimum price value
 * @param maxPrice - Initial maximum price value  
 * @param minRange - Slider minimum boundary (default: 0)
 * @param maxRange - Slider maximum boundary (default: 150000)
 * @param step - Price increment step (default: 1000)
 * @param currency - Currency code for formatting (default: DEFAULT_CURRENCY)
 * @param onChange - Callback fired when price range changes
 * @param t - Translation function for i18n support
 * @param locale - Locale for number formatting (default: 'en-US')
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
  locale = 'en-US'
}) => {
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
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
    if (!minThumbRef.current || !maxThumbRef.current || !trackRef.current) return;

    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    minThumbRef.current.style.left = `${minPercent}%`;
    maxThumbRef.current.style.left = `${maxPercent}%`;
    
    trackRef.current.style.left = `${minPercent}%`;
    trackRef.current.style.width = `${maxPercent - minPercent}%`;
  }, [minVal, maxVal, getPercent]);

  // Handle mouse/touch down on thumbs
  const handleMouseDown = useCallback((type: 'min' | 'max') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = getValueFromPercent(percent);

    if (isDragging === 'min') {
      const newMin = Math.min(value, maxVal - step);
      setMinVal(Math.max(minRange, newMin));
    } else {
      const newMax = Math.max(value, minVal + step);
      setMaxVal(Math.min(maxRange, newMax));
    }
  }, [isDragging, maxVal, minVal, step, minRange, maxRange, getValueFromPercent]);

  // Handle mouse/touch up
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    // Trigger change when dragging stops to avoid shaking during drag
    if (hasUserInteracted) {
      onChange(
        minVal === minRange ? undefined : minVal,
        maxVal === maxRange ? undefined : maxVal
      );
    }
  }, [hasUserInteracted, minVal, maxVal, minRange, maxRange, onChange]);

  // Handle click on slider track
  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const value = getValueFromPercent(percent);

    setHasUserInteracted(true);

    // Move the closest thumb
    const minDistance = Math.abs(value - minVal);
    const maxDistance = Math.abs(value - maxVal);

    if (minDistance <= maxDistance) {
      setMinVal(Math.max(minRange, Math.min(value, maxVal - step)));
    } else {
      setMaxVal(Math.min(maxRange, Math.max(value, minVal + step)));
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

  // Notify parent of changes - ONLY when user has interacted and NOT dragging
  // Remove internal debounce since useOptimizedFiltering already provides 300ms debouncing
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hasUserInteracted || isDragging) return;

    onChangeRef.current(
      minVal === minRange ? undefined : minVal,
      maxVal === maxRange ? undefined : maxVal
    );
  }, [minVal, maxVal, minRange, maxRange, hasUserInteracted, isDragging]);

  const formatValue = useCallback((value: number) => {
    // Use provided locale or default to 'en-US' for consistent formatting
    return formatNumber(value, locale, { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [currency, locale]);

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
                setMinVal(Math.max(minRange, Math.min(value, maxVal - step)));
              }}
              placeholder={formatValue(minRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step={step}
              min={minRange}
              max={maxVal - step}
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
              placeholder={formatValue(maxRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step={step}
              min={minVal + step}
              max={maxRange}
            />
          </div>
        </div>
      )}
    </div>
  );
});

PriceSlider.displayName = 'PriceSlider';

export default PriceSlider;
