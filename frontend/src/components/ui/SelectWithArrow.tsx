import React from 'react';

interface SelectWithArrowProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isLoading?: boolean;
  isRTL?: boolean;
  children: React.ReactNode;
}

export const SelectWithArrow: React.FC<SelectWithArrowProps> = ({
  isLoading = false,
  isRTL = false,
  className = '',
  children,
  ...props
}) => {
  const sidePaddingClass = isRTL ? 'pl-10' : 'pr-10';
  const baseFieldClasses = `appearance-none w-full px-4 py-3 ${sidePaddingClass}`;
  const mergedClasses = `${baseFieldClasses} ${className}`.trim();

  return (
    <div className="relative">
      <select
        {...props}
        className={mergedClasses}
      >
        {children}
      </select>
      <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isLoading ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          )}
        </svg>
      </div>
    </div>
  );
};
