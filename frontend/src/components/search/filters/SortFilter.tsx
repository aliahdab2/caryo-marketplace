import React from 'react';

interface SortFilterProps {
  selectedSort?: string;
  onSortChange: (sort: string) => void;
  t: (key: string, fallback?: string, options?: Record<string, unknown>) => string;
}

const SortFilter: React.FC<SortFilterProps> = ({
  selectedSort,
  onSortChange,
  t
}) => {
  const sortOptions = [
    { value: 'relevance', label: 'sortOptionsRelevance' },
    { value: 'priceLowToHigh', label: 'sortOptionsPriceLowToHigh' },
    { value: 'priceHighToLow', label: 'sortOptionsPriceHighToLow' },
    { value: 'distance', label: 'sortOptionsDistance' },
    { value: 'mileage', label: 'sortOptionsMileage' },
    { value: 'ageNewest', label: 'sortOptionsAgeNewest' },
    { value: 'ageOldest', label: 'sortOptionsAgeOldest' },
    { value: 'mostRecent', label: 'sortOptionsMostRecent' }
  ];

  return (
    <div className="space-y-3">
      {sortOptions.map((option) => (
        <label
          key={option.value}
          className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
        >
          <input
            type="radio"
            name="sort"
            value={option.value}
            checked={selectedSort === option.value}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t(option.label)}
          </span>
        </label>
      ))}
    </div>
  );
};

export default SortFilter;