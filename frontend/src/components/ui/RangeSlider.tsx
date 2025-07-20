"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguageDirection } from '@/utils/languageDirection';
import { formatNumber } from '@/utils/localization';

export interface RangeSliderProps {
  minValue?: number;
  maxValue?: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
  trackColor?: string;
  thumbColor?: string;
  showInputs?: boolean;
  showLabels?: boolean;
  showRangeLabels?: boolean;
  disabled?: boolean;
  
  // Formatting options
  formatValue?: (value: number) => string;
  locale?: string;
  
  // Labels
  minLabel?: string;
  maxLabel?: string;
  anyPlaceholder?: string;
  
  // Accessibility
  ariaLabelMin?: string;
  ariaLabelMax?: string;
}

/**
 * Reusable dual-range slider component
 * Can be used for prices, years, mileage, or any numeric range
 */
const RangeSlider: React.FC<RangeSliderProps> = React.memo(({
  minValue,
  maxValue,
  minRange = 0,
  maxRange = 100,
  step = 1,
  onChange,
  className = '',
  trackColor = 'bg-blue-500',
  thumbColor = 'bg-blue-600',
  showInputs = true,
  showLabels = true,
  showRangeLabels = true,
  disabled = false,
  formatValue,
  locale = 'en-US',
  minLabel = 'Min',
  maxLabel = 'Max',
  anyPlaceholder = 'Any',
  ariaLabelMin = 'Minimum value',
  ariaLabelMax = 'Maximum value'
}) => {
  const { dirClass, dir } = useLanguageDirection();

  // Internal state
  const [minVal, setMinVal] = useState(() => {
    const initial = minValue || minRange;
    return Math.max(minRange, Math.min(initial, maxRange - step));
  });
  const [maxVal, setMaxVal] = useState(() => {
    const initial = maxValue || maxRange;
    return Math.min(maxRange, Math.max(initial, minRange + step));
  });

  // Dragging state
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [hoveredThumb, setHoveredThumb] = useState<'min' | 'max' | null>(null);
  
  // Refs
  const sliderRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);
  const isUserTyping = useRef<{ min: boolean; max: boolean }>({ min: false, max: false });

  // Update internal state when props change
  useEffect(() => {
    if (minValue !== undefined) {
      const newMin = Math.max(minRange, Math.min(minValue, maxRange - step));
      setMinVal(newMin);
    }
  }, [minValue, minRange, maxRange, step]);

  useEffect(() => {
    if (maxValue !== undefined) {
      const newMax = Math.min(maxRange, Math.max(maxValue, minRange + step));
      setMaxVal(newMax);
    }
  }, [maxValue, minRange, maxRange, step]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Debounced onChange
  const debouncedOnChange = useCallback((min: number, max: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const currentMin = min === minRange ? undefined : min;
      const currentMax = max === maxRange ? undefined : max;
      onChange(currentMin, currentMax);
    }, 100);
  }, [minRange, maxRange, onChange]);

  // Calculate percentages
  const minPercent = ((minVal - minRange) / (maxRange - minRange)) * 100;
  const maxPercent = ((maxVal - minRange) / (maxRange - minRange)) * 100;

  // Get value from mouse position
  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return minRange;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const value = (percent / 100) * (maxRange - minRange) + minRange;
    
    return Math.round(value / step) * step;
  }, [minRange, maxRange, step]);

  // Handle mouse down on thumbs
  const handleThumbMouseDown = useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(thumb);
    setHoveredThumb(null);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const value = getValueFromPosition(moveEvent.clientX);
      
      if (thumb === 'min') {
        const newMin = Math.max(minRange, Math.min(value, maxVal - step));
        setMinVal(newMin);
        debouncedOnChange(newMin, maxVal);
      } else {
        const newMax = Math.min(maxRange, Math.max(value, minVal + step));
        setMaxVal(newMax);
        debouncedOnChange(minVal, newMax);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [minVal, maxVal, minRange, maxRange, step, getValueFromPosition, debouncedOnChange, disabled]);

  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (isDragging || disabled) return;

    const value = getValueFromPosition(e.clientX);
    const minDistance = Math.abs(value - minVal);
    const maxDistance = Math.abs(value - maxVal);

    if (minDistance <= maxDistance) {
      const newMin = Math.max(minRange, Math.min(value, maxVal - step));
      setMinVal(newMin);
      debouncedOnChange(newMin, maxVal);
    } else {
      const newMax = Math.min(maxRange, Math.max(value, minVal + step));
      setMaxVal(newMax);
      debouncedOnChange(minVal, newMax);
    }
  }, [isDragging, minVal, maxVal, minRange, maxRange, step, getValueFromPosition, debouncedOnChange, disabled]);

  // Format values
  const formatVal = useCallback((value: number) => {
    if (formatValue) {
      return formatValue(value);
    }
    return formatNumber(value, locale);
  }, [formatValue, locale]);

  // Sync input values when state changes
  useEffect(() => {
    if (minInputRef.current && !isUserTyping.current.min && document.activeElement !== minInputRef.current) {
      minInputRef.current.value = minVal === minRange ? '' : minVal.toString();
    }
    if (maxInputRef.current && !isUserTyping.current.max && document.activeElement !== maxInputRef.current) {
      maxInputRef.current.value = maxVal === maxRange ? '' : maxVal.toString();
    }
  }, [minVal, maxVal, minRange, maxRange]);

  // Handle input field changes
  const handleInputChange = useCallback((type: 'min' | 'max', inputValue: string) => {
    isUserTyping.current[type] = true;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (inputValue === '') {
        if (type === 'min') {
          setMinVal(minRange);
          debouncedOnChange(minRange, maxVal);
        } else {
          setMaxVal(maxRange);
          debouncedOnChange(minVal, maxRange);
        }
      } else {
        const numValue = parseInt(inputValue);
        if (!isNaN(numValue)) {
          if (type === 'min') {
            const constrainedValue = Math.max(minRange, Math.min(numValue, maxVal - step));
            setMinVal(constrainedValue);
            debouncedOnChange(constrainedValue, maxVal);
          } else {
            const constrainedValue = Math.min(maxRange, Math.max(numValue, minVal + step));
            setMaxVal(constrainedValue);
            debouncedOnChange(minVal, constrainedValue);
          }
        }
      }
      
      isUserTyping.current[type] = false;
    }, 800);
  }, [minVal, maxVal, minRange, maxRange, step, debouncedOnChange]);

  const thumbClassName = `absolute w-6 h-6 ${thumbColor} border-2 border-white rounded-full shadow-lg cursor-pointer transition-all duration-150 ease-out ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <div className={`range-slider ${className}`} dir={dir}>
      {/* Value Display */}
      {showLabels && (
        <div className="flex justify-between items-center mb-6">
          <div className={`text-center ${dirClass}`}>
            <div className="text-lg font-semibold text-gray-900">
              {formatVal(minVal)}
            </div>
          </div>
          <div className={`text-center ${dirClass}`}>
            <div className="text-lg font-semibold text-gray-900">
              {formatVal(maxVal)}
            </div>
          </div>
        </div>
      )}

      {/* Slider */}
      <div className="relative px-3 py-6">
        <div 
          ref={sliderRef}
          className={`relative h-2 bg-gray-200 rounded-full ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
          onClick={handleTrackClick}
        >
          {/* Active track */}
          <div 
            className={`absolute h-2 ${trackColor} rounded-full`}
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />

          {/* Min thumb */}
          <div
            className={`${thumbClassName} ${
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
            aria-label={ariaLabelMin}
            aria-valuemin={minRange}
            aria-valuemax={maxVal - step}
            aria-valuenow={minVal}
            aria-valuetext={formatVal(minVal)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onMouseDown={handleThumbMouseDown('min')}
            onMouseEnter={() => !isDragging && !disabled && setHoveredThumb('min')}
            onMouseLeave={() => setHoveredThumb(null)}
            onKeyDown={(e) => {
              if (disabled) return;
              
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                const newValue = Math.max(minRange, minVal - step);
                setMinVal(newValue);
                debouncedOnChange(newValue, maxVal);
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                const newValue = Math.min(maxVal - step, minVal + step);
                setMinVal(newValue);
                debouncedOnChange(newValue, maxVal);
              }
            }}
          />

          {/* Max thumb */}
          <div
            className={`${thumbClassName} ${
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
            aria-label={ariaLabelMax}
            aria-valuemin={minVal + step}
            aria-valuemax={maxRange}
            aria-valuenow={maxVal}
            aria-valuetext={formatVal(maxVal)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onMouseDown={handleThumbMouseDown('max')}
            onMouseEnter={() => !isDragging && !disabled && setHoveredThumb('max')}
            onMouseLeave={() => setHoveredThumb(null)}
            onKeyDown={(e) => {
              if (disabled) return;
              
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                const newValue = Math.max(minVal + step, maxVal - step);
                setMaxVal(newValue);
                debouncedOnChange(minVal, newValue);
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                const newValue = Math.min(maxRange, maxVal + step);
                setMaxVal(newValue);
                debouncedOnChange(minVal, newValue);
              }
            }}
          />
        </div>

        {/* Range labels */}
        {showRangeLabels && (
          <div className="flex justify-between mt-3 text-sm text-gray-500">
            <span className={dirClass}>{formatVal(minRange)}</span>
            <span className={dirClass}>{formatVal(maxRange)}</span>
          </div>
        )}
      </div>

      {/* Input fields */}
      {showInputs && (
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label htmlFor="min-value-input" className={`block text-sm text-gray-600 mb-2 ${dirClass}`} dir={dir}>
              {minLabel}
            </label>
            <input
              ref={minInputRef}
              id="min-value-input"
              type="number"
              defaultValue={minVal === minRange ? '' : minVal.toString()}
              onChange={(e) => handleInputChange('min', e.target.value)}
              onBlur={() => {
                isUserTyping.current.min = false;
              }}
              placeholder={anyPlaceholder}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              step={step}
              min={minRange}
            />
          </div>
          <div>
            <label htmlFor="max-value-input" className={`block text-sm text-gray-600 mb-2 ${dirClass}`} dir={dir}>
              {maxLabel}
            </label>
            <input
              ref={maxInputRef}
              id="max-value-input"
              type="number"
              defaultValue={maxVal === maxRange ? '' : maxVal.toString()}
              onChange={(e) => handleInputChange('max', e.target.value)}
              onBlur={() => {
                isUserTyping.current.max = false;
              }}
              placeholder={anyPlaceholder}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              step={step}
              max={maxRange}
            />
          </div>
        </div>
      )}
    </div>
  );
});

RangeSlider.displayName = 'RangeSlider';

export default RangeSlider;
