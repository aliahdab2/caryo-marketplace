"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguageDirection } from '@/utils/languageDirection';
import { formatNumber } from '@/utils/localization';
import { SLIDER_CLASSES, INPUT_CLASSES, LAYOUT_CLASSES } from './PriceSlider.constants';

export interface RangeSliderProps {
  minValue?: number;
  maxValue?: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  className?: string;
  showInputs?: boolean;
  disabled?: boolean;
  
  // Formatting options
  formatValue?: (value: number) => string;
  locale?: string;
  unit?: string; // Unit display (currency, km, years, etc.)
  
  // Labels
  minLabel?: string;
  maxLabel?: string;
  anyPlaceholder?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  
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
  showInputs = true,
  disabled = false,
  formatValue,
  locale = 'en-US',
  unit,
  minLabel = 'Min',
  maxLabel = 'Max',
  anyPlaceholder = 'Any',
  minPlaceholder,
  maxPlaceholder,
  ariaLabelMin = 'Minimum value',
  ariaLabelMax = 'Maximum value'
}) => {
  const { dirClass, dir } = useLanguageDirection();
  const isRTL = dir === 'rtl';

  // Helper function for input field className
  const getInputFieldClassName = (hasUnit: boolean): string => {
    const baseClasses = `${SLIDER_CLASSES.INPUT_FIELD} ${INPUT_CLASSES.NO_SPINNER}`;
    if (!hasUnit) return baseClasses;
    const paddingClass = isRTL ? 'pl-16' : 'pr-16';
    return `${baseClasses} ${paddingClass}`;
  };

  // Helper function for unit display positioning
  const getUnitDisplayClassName = (): string => {
    const baseClasses = 'absolute top-1/2 transform -translate-y-1/2';
    const positionClass = isRTL ? 'left-3' : 'right-3';
    return `${baseClasses} ${positionClass}`;
  };

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

  // Debounced onChange with optimized timing
  const debouncedOnChange = useCallback((min: number, max: number) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const currentMin = min === minRange ? undefined : min;
      const currentMax = max === maxRange ? undefined : max;
      onChange(currentMin, currentMax);
    }, 50); // Reduced from 100ms for better responsiveness
  }, [minRange, maxRange, onChange]);

  // Calculate percentages
  const minPercent = ((minVal - minRange) / (maxRange - minRange)) * 100;
  const maxPercent = ((maxVal - minRange) / (maxRange - minRange)) * 100;

  // RTL-aware positioning
  const minPosition = dir === 'rtl' ? 100 - minPercent : minPercent;
  const maxPosition = dir === 'rtl' ? 100 - maxPercent : maxPercent;
  const trackLeft = dir === 'rtl' ? 100 - maxPercent : minPercent;
  const trackWidth = maxPercent - minPercent;

  // Get value from mouse position with RTL support
  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return minRange;
    
    const rect = sliderRef.current.getBoundingClientRect();
    let percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    
    // Flip percentage for RTL
    if (dir === 'rtl') {
      percent = 100 - percent;
    }
    
    const value = (percent / 100) * (maxRange - minRange) + minRange;
    
    return Math.round(value / step) * step;
  }, [minRange, maxRange, step, dir]);

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
            // Constrain value to valid range and ensure it doesn't exceed max - step
            const constrainedValue = Math.max(minRange, Math.min(numValue, Math.min(maxRange, maxVal - step)));
            setMinVal(constrainedValue);
            debouncedOnChange(constrainedValue, maxVal);
          } else {
            // Constrain value to valid range and ensure it doesn't go below min + step
            const constrainedValue = Math.min(maxRange, Math.max(numValue, Math.max(minRange, minVal + step)));
            setMaxVal(constrainedValue);
            debouncedOnChange(minVal, constrainedValue);
          }
        }
      }
      
      isUserTyping.current[type] = false;
    }, 500); // Reduced from 800ms for better UX
  }, [minVal, maxVal, minRange, maxRange, step, debouncedOnChange]);

  const thumbClassName = `${SLIDER_CLASSES.THUMB_BASE} ${
    disabled ? SLIDER_CLASSES.THUMB_DISABLED : ''
  }`;

  return (
    <div 
      className={`${SLIDER_CLASSES.CONTAINER} ${className} ${LAYOUT_CLASSES.MODAL_COMPATIBLE}`} 
      dir={dir}
      role="group"
      aria-label="Price range selector"
    >
      {/* Input fields - MOVED TO TOP like Blocket design */}
      {showInputs && (
        <div className={SLIDER_CLASSES.INPUT_GRID}>
          <div className={SLIDER_CLASSES.INPUT_WRAPPER}>
            <label htmlFor="min-value-input" className={`${SLIDER_CLASSES.INPUT_LABEL} ${dirClass}`} dir={dir}>
              {minLabel}
            </label>
            <div className="relative">
              <input
                ref={minInputRef}
                id="min-value-input"
                type="number"
                defaultValue={minVal === minRange ? '' : minVal.toString()}
                onChange={(e) => handleInputChange('min', e.target.value)}
                onBlur={() => {
                  isUserTyping.current.min = false;
                }}
                placeholder={minPlaceholder || anyPlaceholder}
                disabled={disabled}
                className={getInputFieldClassName(!!unit)}
                style={{
                  /* Remove spinner arrows completely */
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                step={step}
                min={minRange}
              />
              {/* Unit display (currency, km, years, etc.) */}
              {unit && (
                <div className={getUnitDisplayClassName()}>
                  <span className="text-gray-600 font-medium">{unit}</span>
                </div>
              )}
            </div>
          </div>
          <div className={SLIDER_CLASSES.INPUT_WRAPPER}>
            <label htmlFor="max-value-input" className={`${SLIDER_CLASSES.INPUT_LABEL} ${dirClass}`} dir={dir}>
              {maxLabel}
            </label>
            <div className="relative">
              <input
                ref={maxInputRef}
                id="max-value-input"
                type="number"
                defaultValue={maxVal === maxRange ? '' : maxVal.toString()}
                onChange={(e) => handleInputChange('max', e.target.value)}
                onBlur={() => {
                  isUserTyping.current.max = false;
                }}
                placeholder={maxPlaceholder || anyPlaceholder}
                disabled={disabled}
                className={getInputFieldClassName(!!unit)}
                style={{
                  /* Remove spinner arrows completely */
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                step={step}
                max={maxRange}
              />
              {/* Unit display (currency, km, years, etc.) */}
              {unit && (
                <div className={getUnitDisplayClassName()}>
                  <span className="text-gray-600 font-medium">{unit}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slider - MOVED BELOW INPUTS like Blocket design */}
      <div className={SLIDER_CLASSES.TRACK_CONTAINER}>
        <div 
          ref={sliderRef}
          className={`${SLIDER_CLASSES.TRACK_BASE} ${disabled ? SLIDER_CLASSES.DISABLED : ''}`}
          onClick={handleTrackClick}
        >
          {/* Active track */}
          <div 
            className={SLIDER_CLASSES.TRACK_ACTIVE}
            style={{
              left: `${trackLeft}%`,
              width: `${trackWidth}%`
            }}
          />

          {/* Min thumb */}
          <div
            className={`${thumbClassName} ${
              isDragging === 'min' 
                ? SLIDER_CLASSES.THUMB_ACTIVE
                : hoveredThumb === 'min' 
                  ? SLIDER_CLASSES.THUMB_HOVER
                  : ''
            }`}
            style={{
              left: `${minPosition}%`,
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
              
              // In RTL, left arrow should increase and right arrow should decrease
              const isDecrease = dir === 'rtl' 
                ? (e.key === 'ArrowRight' || e.key === 'ArrowDown')
                : (e.key === 'ArrowLeft' || e.key === 'ArrowDown');
              const isIncrease = dir === 'rtl'
                ? (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
                : (e.key === 'ArrowRight' || e.key === 'ArrowUp');
              
              if (isDecrease) {
                e.preventDefault();
                const newValue = Math.max(minRange, minVal - step);
                setMinVal(newValue);
                debouncedOnChange(newValue, maxVal);
              } else if (isIncrease) {
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
                ? SLIDER_CLASSES.THUMB_ACTIVE
                : hoveredThumb === 'max' 
                  ? SLIDER_CLASSES.THUMB_HOVER
                  : ''
            }`}
            style={{
              left: `${maxPosition}%`,
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
              
              // In RTL, left arrow should increase and right arrow should decrease
              const isDecrease = dir === 'rtl' 
                ? (e.key === 'ArrowRight' || e.key === 'ArrowDown')
                : (e.key === 'ArrowLeft' || e.key === 'ArrowDown');
              const isIncrease = dir === 'rtl'
                ? (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
                : (e.key === 'ArrowRight' || e.key === 'ArrowUp');
              
              if (isDecrease) {
                e.preventDefault();
                const newValue = Math.max(minVal + step, maxVal - step);
                setMaxVal(newValue);
                debouncedOnChange(minVal, newValue);
              } else if (isIncrease) {
                e.preventDefault();
                const newValue = Math.min(maxRange, maxVal + step);
                setMaxVal(newValue);
                debouncedOnChange(minVal, newValue);
              }
            }}
          />
        </div>
        
        {/* Range labels aligned with slider track */}
        <div className="flex justify-between text-sm text-gray-500 mt-2 px-3">
          <span>{minRange.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
          <span>{maxRange.toLocaleString()}{unit ? ` ${unit}` : ''}</span>
        </div>
      </div>
      
    </div>
  );
});

RangeSlider.displayName = 'RangeSlider';

export default RangeSlider;
