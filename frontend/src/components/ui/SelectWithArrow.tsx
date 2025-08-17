import React from 'react';

interface SelectWithArrowProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  isLoading?: boolean;
  isRTL?: boolean;
  // When a status icon (error/check) is rendered inside the parent as an absolute element,
  // reserve space for it and shift the dropdown arrow to avoid overlap.
  hasStatusIcon?: boolean;
  children: React.ReactNode;
}

export const SelectWithArrow: React.FC<SelectWithArrowProps> = ({
  isLoading = false,
  isRTL = false,
  hasStatusIcon = false,
  className = '',
  children,
  ...props
}) => {
  // Reserve extra padding if a status icon is shown by the parent
  const sidePaddingClass = isRTL
    ? (hasStatusIcon ? 'pl-14' : 'pl-10')
    : (hasStatusIcon ? 'pr-14' : 'pr-10');
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
      <div
        data-testid="select-arrow"
        className={`absolute inset-y-0 ${isRTL ? (hasStatusIcon ? 'left-8 pl-1' : 'left-0 pl-3') : (hasStatusIcon ? 'right-8 pr-1' : 'right-0 pr-3')} flex items-center pointer-events-none`}
      >
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
