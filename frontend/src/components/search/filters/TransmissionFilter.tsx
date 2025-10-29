import React from 'react';
import { CarReferenceData } from '@/services/api';
import { TransmissionCounts } from '@/hooks/useTransmissionCounts';

interface TransmissionFilterProps {
  referenceData: CarReferenceData | null | undefined;
  currentLanguage: string;
  selectedTransmissionId?: number;
  onTransmissionChange: (transmissionId: number | undefined) => void;
  variant?: 'dropdown' | 'cards';
  isLoading?: boolean;
  disableScroll?: boolean;
  transmissionCounts?: TransmissionCounts;
  t: (key: string, fallback?: string) => string;
}

const TransmissionFilter: React.FC<TransmissionFilterProps> = ({
  referenceData,
  currentLanguage,
  selectedTransmissionId,
  onTransmissionChange,
  variant = 'cards',
  isLoading = false,
  disableScroll = false,
  transmissionCounts = {},
  t
}) => {
  if (variant === 'dropdown') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{t('search:gearbox', 'Gearbox')}</h3>
          <select
            value={selectedTransmissionId || ''}
            onChange={(e) => onTransmissionChange(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            disabled={isLoading}
          >
            <option value="">{t('search:any', 'Any')}</option>
            {referenceData?.transmissions?.map(transmission => (
              <option key={transmission.id} value={transmission.id}>
                {currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Cards variant (default)
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${disableScroll ? '' : 'max-h-96 overflow-y-auto pr-2 rtl:pr-0 rtl:pl-2'}`}>
        {referenceData?.transmissions?.map(transmission => {
          const isSelected = selectedTransmissionId === transmission.id;
          const displayName = currentLanguage === 'ar' ? transmission.displayNameAr : transmission.displayNameEn;
          const count = transmissionCounts[transmission.name.toLowerCase()] || transmissionCounts[transmission.name] || 0;

          return (
            <div
              key={transmission.id}
              className={`group relative flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
              }`}
              onClick={() => {
                onTransmissionChange(isSelected ? undefined : transmission.id);
              }}
            >
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="transition-transform group-hover:scale-105">
                  <div className="w-10 h-7 flex items-center justify-center text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-gray-900 font-medium">{displayName}</span>
                  <span className="text-gray-500 text-sm">
                    {count > 0 ? `(${count.toLocaleString()})` : '(0)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 scale-110'
                    : 'border-gray-300 group-hover:border-blue-400'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransmissionFilter;