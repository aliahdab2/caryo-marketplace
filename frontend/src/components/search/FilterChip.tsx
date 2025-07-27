import React from 'react';
import { MdClose } from 'react-icons/md';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
  removeButtonLabel?: string;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  onRemove,
  icon,
  removeButtonLabel = 'Remove filter',
  className = ''
}) => {
  return (
    <div className={`group inline-flex items-center bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${className}`}>
      {icon && (
        <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
      )}
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5 transition-colors"
        aria-label={removeButtonLabel}
      >
        <MdClose className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterChip; 