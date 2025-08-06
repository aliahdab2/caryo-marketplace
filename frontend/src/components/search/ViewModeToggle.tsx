"use client";

import React from 'react';
import { MdViewModule, MdViewList } from 'react-icons/md';

export type ViewMode = 'grid' | 'list';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  t: (key: string, fallback?: string) => string;
  isRTL?: boolean;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  t,
  isRTL = false
}) => {
  // Helper function to get translation with fallback
  const getTranslation = (key: string, fallback: string) => {
    // Try the key as is first
    let translated = t(key, '');
    if (translated && translated !== key) {
      return translated;
    }
    
    // Try with search namespace prefix
    const searchKey = `search:${key}`;
    translated = t(searchKey, '');
    if (translated && translated !== searchKey) {
      return translated;
    }
    
    // Try with common namespace prefix
    const commonKey = `common:${key}`;
    translated = t(commonKey, '');
    if (translated && translated !== commonKey) {
      return translated;
    }
    
    // Return fallback if no translation found
    return fallback;
  };

  return (
    <div className={`flex items-center ${isRTL ? 'justify-start' : 'justify-start'}`}>
      <div className="flex gap-2 rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`
            flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors
            ${viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
          aria-label={getTranslation('gridView', 'Grid view')}
          title={getTranslation('gridView', 'Grid view')}
        >
          <MdViewModule size={20} />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`
            flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors
            ${viewMode === 'list'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
          aria-label={getTranslation('listView', 'List view')}
          title={getTranslation('listView', 'List view')}
        >
          <MdViewList size={20} />
        </button>
      </div>
    </div>
  );
};

export default ViewModeToggle;
