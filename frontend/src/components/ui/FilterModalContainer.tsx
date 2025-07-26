import React from 'react';

interface FilterModalContainerProps {
  title?: string;
  dirClass: string;
  children: React.ReactNode;
  showSeparator?: boolean;
}

/**
 * Unified container for filter modals
 * Provides consistent styling and structure
 */
export const FilterModalContainer: React.FC<FilterModalContainerProps> = ({
  title,
  dirClass,
  children,
  showSeparator = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        {title && (
          <h3 
            id="filter-modal-title"
            className={`text-base font-medium text-gray-900 mb-3 text-center ${dirClass}`}
          >
            {title}
          </h3>
        )}
        {showSeparator && (
          <div className="w-full h-px bg-gray-200 mb-4"></div>
        )}
        {children}
      </div>
    </div>
  );
};
