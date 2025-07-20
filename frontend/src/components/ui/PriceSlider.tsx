"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CURRENCY, getOptimalLocale } from '../../utils/currency';
import { formatNumber } from '../../utils/localization';
import type { PriceSliderProps } from '../../types/ui';

/**
 * Simple and reliable dual-range price slider
 * Uses custom mouse/touch handling for smooth interaction
 */
const PriceSlider: React.FC<PriceSliderProps> = React.memo(({
  minPrice,
  maxPrice,
  minRange = 0,
  maxRange = 150000,
  step = 500, // Reduced from 1000 to 500 for better sensitivity
  currency = DEFAULT_CURRENCY,
  onChange,
  className = '',
  trackColor: _trackColor = 'bg-blue-500',
  thumbColor: _thumbColor = 'bg-blue-600',
  showInputs = true,
  showLabels = true,
  t = (key: string, fallback: string) => fallback,
  locale
}) => {
  // Validation
  useEffect(() => {
    if (minRange >= maxRange) {
      console.warn(t('priceSlider.minRangeError', 'PriceSlider: minRange should be less than maxRange'));
    }
  }, [minRange, maxRange, t]);

  // Auto-detect locale from i18n context if not provided
  const { i18n } = useTranslation();
  const currentLocale = locale || i18n.language || 'en-US';

  // Internal state
  const [minValue, setMinValue] = useState(() => {
    const initial = minPrice || minRange;
    return Math.max(minRange, Math.min(initial, maxRange - step));
  });
  const [maxValue, setMaxValue] = useState(() => {
    const initial = maxPrice || maxRange;
    return Math.min(maxRange, Math.max(initial, minRange + step));
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [hoveredThumb, setHoveredThumb] = useState<'min' | 'max' | null>(null);
  
  // Refs
  const sliderRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Update internal state when props change
  useEffect(() => {
    if (minPrice !== undefined) {
      const newMin = Math.max(minRange, Math.min(minPrice, maxRange - step));
      setMinValue(newMin);
    }
  }, [minPrice, minRange, maxRange, step]);

  useEffect(() => {
    if (maxPrice !== undefined) {
      const newMax = Math.min(maxRange, Math.max(maxPrice, minRange + step));
      setMaxValue(newMax);
    }
  }, [maxPrice, minRange, maxRange, step]);

  // Debounced onChange - reduced delay for more responsive updates
  const debouncedOnChange = useCallback((min: number, max: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const currentMin = min === minRange ? undefined : min;
      const currentMax = max === maxRange ? undefined : max;
      onChange(currentMin, currentMax);
    }, 100); // Reduced from 150ms to 100ms for faster response
  }, [minRange, maxRange, onChange]);

  // Calculate percentages
  const minPercent = ((minValue - minRange) / (maxRange - minRange)) * 100;
  const maxPercent = ((maxValue - minRange) / (maxRange - minRange)) * 100;

  // Get value from mouse position with improved precision
  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return minRange;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = (percent / 100) * (maxRange - minRange) + minRange;
    
    // More precise rounding for better sensitivity
    return Math.round(value / step) * step;
  }, [minRange, maxRange, step]);

  // Handle mouse down on thumbs with immediate visual feedback
  const handleThumbMouseDown = useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(thumb);
    setHoveredThumb(null); // Clear hover state when dragging starts

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const value = getValueFromPosition(moveEvent.clientX);
      
      if (thumb === 'min') {
        const newMin = Math.max(minRange, Math.min(value, maxValue - step));
        setMinValue(newMin); // Immediate visual update
        debouncedOnChange(newMin, maxValue); // Debounced API call
      } else {
        const newMax = Math.min(maxRange, Math.max(value, minValue + step));
        setMaxValue(newMax); // Immediate visual update
        debouncedOnChange(minValue, newMax); // Debounced API call
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [minValue, maxValue, minRange, maxRange, step, getValueFromPosition, debouncedOnChange]);

  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;

    const value = getValueFromPosition(e.clientX);
    const minDistance = Math.abs(value - minValue);
    const maxDistance = Math.abs(value - maxValue);

    if (minDistance <= maxDistance) {
      const newMin = Math.max(minRange, Math.min(value, maxValue - step));
      setMinValue(newMin);
      debouncedOnChange(newMin, maxValue);
    } else {
      const newMax = Math.min(maxRange, Math.max(value, minValue + step));
      setMaxValue(newMax);
      debouncedOnChange(minValue, newMax);
    }
  }, [isDragging, minValue, maxValue, minRange, maxRange, step, getValueFromPosition, debouncedOnChange]);

  // Format currency values
  const formatValue = useCallback((value: number) => {
    const formattingLocale = getOptimalLocale(currentLocale);
    
    return formatNumber(value, formattingLocale, { 
      style: 'currency', 
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, [currency, currentLocale]);

  // Handle input field changes
  const handleInputChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = value ? parseInt(value) : (type === 'min' ? minRange : maxRange);
    
    if (type === 'min') {
      const constrainedValue = Math.max(minRange, Math.min(numValue, maxValue - step));
      setMinValue(constrainedValue);
      debouncedOnChange(constrainedValue, maxValue);
    } else {
      const constrainedValue = Math.min(maxRange, Math.max(numValue, minValue + step));
      setMaxValue(constrainedValue);
      debouncedOnChange(minValue, constrainedValue);
    }
  }, [minValue, maxValue, minRange, maxRange, step, debouncedOnChange]);

  return (
    <div className={`price-slider ${className}`}>
      {/* Value Display */}
      {showLabels && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(minValue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {formatValue(maxValue)}
            </div>
          </div>
        </div>
      )}

      {/* Slider */}
      <div className="relative px-3 py-6">
        <div 
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active track */}
          <div 
            className="absolute h-2 bg-blue-500 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />

          {/* Min thumb */}
          <div
            className={`absolute w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-pointer transition-all duration-150 ease-out ${
              isDragging === 'min' 
                ? 'shadow-xl' 
                : hoveredThumb === 'min' 
                  ? 'shadow-xl' 
                  : ''
            }`}
            style={{
              left: `${minPercent}%`,
              top: '50%',
              transform: `translate(-50%, -50%) ${
                isDragging === 'min' 
                  ? 'scale(1.1)' 
                  : hoveredThumb === 'min' 
                    ? 'scale(1.05)' 
                    : 'scale(1)'
              }`
            }}
            role="slider"
            aria-label={t('priceSlider.minPrice', 'Minimum price')}
            aria-valuemin={minRange}
            aria-valuemax={maxValue - step}
            aria-valuenow={minValue}
            aria-valuetext={formatValue(minValue)}
            tabIndex={0}
            onMouseDown={handleThumbMouseDown('min')}
            onMouseEnter={() => !isDragging && setHoveredThumb('min')}
            onMouseLeave={() => setHoveredThumb(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                const newValue = Math.max(minRange, minValue - step);
                setMinValue(newValue);
                debouncedOnChange(newValue, maxValue);
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                const newValue = Math.min(maxValue - step, minValue + step);
                setMinValue(newValue);
                debouncedOnChange(newValue, maxValue);
              }
            }}
          />

          {/* Max thumb */}
          <div
            className={`absolute w-6 h-6 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-pointer transition-all duration-150 ease-out ${
              isDragging === 'max' 
                ? 'shadow-xl' 
                : hoveredThumb === 'max' 
                  ? 'shadow-xl' 
                  : ''
            }`}
            style={{
              left: `${maxPercent}%`,
              top: '50%',
              transform: `translate(-50%, -50%) ${
                isDragging === 'max' 
                  ? 'scale(1.1)' 
                  : hoveredThumb === 'max' 
                    ? 'scale(1.05)' 
                    : 'scale(1)'
              }`
            }}
            role="slider"
            aria-label={t('priceSlider.maxPrice', 'Maximum price')}
            aria-valuemin={minValue + step}
            aria-valuemax={maxRange}
            aria-valuenow={maxValue}
            aria-valuetext={formatValue(maxValue)}
            tabIndex={0}
            onMouseDown={handleThumbMouseDown('max')}
            onMouseEnter={() => !isDragging && setHoveredThumb('max')}
            onMouseLeave={() => setHoveredThumb(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                const newValue = Math.max(minValue + step, maxValue - step);
                setMaxValue(newValue);
                debouncedOnChange(minValue, newValue);
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                const newValue = Math.min(maxRange, maxValue + step);
                setMaxValue(newValue);
                debouncedOnChange(minValue, newValue);
              }
            }}
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
              value={minValue === minRange ? '' : minValue}
              onChange={(e) => handleInputChange('min', e.target.value)}
              placeholder={minValue === minRange ? t('any', 'Any') : formatValue(minRange)}
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
              value={maxValue === maxRange ? '' : maxValue}
              onChange={(e) => handleInputChange('max', e.target.value)}
              placeholder={maxValue === maxRange ? t('any', 'Any') : formatValue(maxRange)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step={step}
              min={minValue + step}
            />
          </div>
        </div>
      )}
    </div>
  );
});

PriceSlider.displayName = 'PriceSlider';

export default PriceSlider;
