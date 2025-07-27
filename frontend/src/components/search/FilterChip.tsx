import React from 'react';
import { MdClose } from 'react-icons/md';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
  removeButtonLabel?: string;
  className?: string;
  variant?: 'default' | 'brand';
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  onRemove,
  icon,
  removeButtonLabel = 'Remove filter',
  className = '',
  variant = 'default'
}) => {
  const baseClasses = 'group inline-flex items-center border rounded-full px-3 py-2 text-sm font-medium transition-colors';
  
  const variantClasses = variant === 'brand' 
    ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40'
    : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';

  return (
    <div className={`${baseClasses} ${variantClasses} ${className}`}>
      {icon && (
        <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
      )}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className={`ml-2 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full p-0.5 transition-colors ${
          variant === 'brand' 
            ? 'text-blue-200 hover:text-white focus:ring-blue-300' 
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:ring-blue-500'
        }`}
        aria-label={removeButtonLabel}
      >
        <MdClose className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterChip; 