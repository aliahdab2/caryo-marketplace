import React from 'react';

interface TransmissionIconProps {
  transmissionSlug: string;
  className?: string;
}

export const getTransmissionIcon = (transmissionSlug: string, className: string = "w-6 h-6"): React.ReactNode => {
  switch (transmissionSlug.toLowerCase()) {
    case 'automatic':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          {/* Modern automatic transmission icon */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          {/* Smooth automatic pattern */}
          <path d="M8 8h8v1H8z"/>
          <path d="M8 10h8v1H8z"/>
          <path d="M8 12h8v1H8z"/>
          <path d="M8 14h8v1H8z"/>
          {/* Center indicator */}
          <circle cx="12" cy="12" r="1"/>
        </svg>
      );
    
    case 'manual':
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          {/* Modern manual transmission icon */}
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          {/* Manual gear stick */}
          <rect x="11" y="6" width="2" height="10" rx="1"/>
          <rect x="10" y="16" width="4" height="2" rx="1"/>
          {/* Gear positions */}
          <circle cx="12" cy="8" r="0.5"/>
          <circle cx="12" cy="10" r="0.5"/>
          <circle cx="12" cy="12" r="0.5"/>
          <circle cx="12" cy="14" r="0.5"/>
        </svg>
      );
    
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
};

export const TransmissionIcon: React.FC<TransmissionIconProps> = ({ transmissionSlug, className }) => {
  return <>{getTransmissionIcon(transmissionSlug, className)}</>;
}; 