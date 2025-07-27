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
    <div className={`group inline-flex items-center bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.99] shadow-sm hover:shadow-md ${className}`}>
      {icon && (
        <div className="w-8 h-8 mr-1 flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
      )}
      <span className={icon ? 'mr-1' : ''}>{label}</span>
      <button
        onClick={onRemove}
        className="ml-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-800/50 transform hover:scale-105 active:scale-95"
        aria-label={removeButtonLabel}
      >
        <MdClose className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FilterChip; 