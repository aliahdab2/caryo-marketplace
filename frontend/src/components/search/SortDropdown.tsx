import React, { useState, useEffect } from 'react';
import { MdSort, MdKeyboardArrowDown } from 'react-icons/md';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useLanguageDirection } from '@/utils/rtl';
import { getSortDisplayText, SORT_OPTIONS } from '@/utils/sortUtils';

interface SortDropdownProps {
  selectedSort: string;
  onSortChange: (sort: string) => void;
  onSearchTrigger: () => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedSort,
  onSortChange,
  onSearchTrigger
}) => {
  const { t } = useLazyTranslation(['search']);
  const { dirClass, isRTL } = useLanguageDirection();
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const dropdown = document.querySelector('.sort-dropdown-container');
      
      if (dropdown && !dropdown.contains(target)) {
        setShowSortDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSortDropdown(false);
      }
    };

    if (showSortDropdown) {
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showSortDropdown]);

  const handleSortChange = (newSort: string) => {
    onSortChange(newSort);
    setShowSortDropdown(false);
    onSearchTrigger();
  };

  return (
    <div className={`relative sort-dropdown-container ${dirClass}`}>
      <button 
        onClick={() => setShowSortDropdown(!showSortDropdown)}
        className={`flex items-center text-gray-700 hover:text-gray-900 text-sm font-medium px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        aria-label={t('sortBy', 'Sort by')}
      >
        {/* Sort icon - always at the beginning (left side), normal appearance */}
        <MdSort size={20} className="mr-3" />
        
        {/* Text content - in the middle with extra spacing */}
        <span className={`flex-1 pl-2 ${isRTL ? 'text-right pr-2' : 'text-left'}`}>
          {t('sortBy', 'Sort by')}: {getSortDisplayText(selectedSort, t)}
        </span>
        
        {/* Dropdown arrow - always at the end (right side) */}
        <MdKeyboardArrowDown size={20} className="ml-2" />
      </button>
      
      {/* Dropdown Menu */}
      {showSortDropdown && (
        <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50`}>
          <div className="py-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedSort === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {t(option.label, option.fallback)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown; 