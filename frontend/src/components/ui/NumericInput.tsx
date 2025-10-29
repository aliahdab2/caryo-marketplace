import React, { forwardRef, useState, useCallback, useEffect } from 'react';
import { convertArabicNumerals } from '@/utils/numeral/arabic';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  maxLength?: number;
}

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  ({
    value,
    onChange,
    onBlur,
    placeholder,
    className = '',
    error = false,
    disabled = false,
    required = false,
    min,
    max,
    step = 1,
    allowDecimal = false,
    maxLength,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);

    // Handle input changes - allow Arabic and English numerals, filter out non-numeric characters
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Convert Arabic numerals to English first (e.g., ٢٠٢٠ -> 2020)
      const convertedValue = convertArabicNumerals(inputValue);

      // Create regex pattern based on allowDecimal setting
      const numericPattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
      let numericValue = convertedValue.replace(numericPattern, '');

      // Handle decimal points for decimal inputs
      if (allowDecimal) {
        // Ensure only one decimal point
        const decimalCount = (numericValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          const parts = numericValue.split('.');
          numericValue = parts[0] + '.' + parts.slice(1).join('');
        }
      }

      // Apply maxLength if specified
      if (maxLength && numericValue.length > maxLength) {
        numericValue = numericValue.slice(0, maxLength);
      }

      setDisplayValue(numericValue);
      onChange(numericValue);
    }, [onChange, allowDecimal, maxLength]);

    // Handle blur to validate and format
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const numericValue = displayValue;

      if (!numericValue) {
        onBlur?.(e);
        return;
      }

      let correctedValue = numericValue;

      // Validate min/max if provided
      const numValue = allowDecimal ? parseFloat(numericValue) : parseInt(numericValue);

      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) {
          correctedValue = min.toString();
        } else if (max !== undefined && numValue > max) {
          correctedValue = max.toString();
        }

        // Format the value if it changed
        if (correctedValue !== numericValue) {
          setDisplayValue(correctedValue);
          onChange(correctedValue);
        }
      }

      onBlur?.(e);
    }, [displayValue, min, max, onChange, onBlur, allowDecimal]);

    // Update display value when prop value changes
    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        pattern={allowDecimal ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${
          error ? 'border-red-300 dark:border-red-600 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';

export default NumericInput;