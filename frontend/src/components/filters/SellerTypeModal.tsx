import React from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { SellerTypeCounts } from '@/types/sellerTypes';

interface SellerType {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

interface SellerTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerTypes: SellerType[];
  selectedSellerTypeId?: number;
  sellerTypeCounts: SellerTypeCounts;
  onSellerTypeChange: (sellerTypeId: number | undefined) => void;
  onClearFilter: () => void;
  totalResults: number;
}

const SellerTypeModal: React.FC<SellerTypeModalProps> = ({
  isOpen,
  onClose,
  sellerTypes,
  selectedSellerTypeId,
  sellerTypeCounts,
  onSellerTypeChange,
  onClearFilter,
  totalResults
}) => {
  const { t, i18n } = useLazyTranslation(['search']);
  
  if (!isOpen) return null;

  const currentLanguage = i18n.language;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto pointer-events-none">
      <div className="flex min-h-full items-start justify-center p-4 pt-16 text-center sm:items-start sm:pt-20 sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/3 transition-opacity pointer-events-auto" onClick={onClose} />
        
        {/* Modal */}
        <div 
          className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 border border-gray-100 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-type-modal-title"
        >
          {/* Close Button */}
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              type="button"
              className="rounded-md bg-white text-gray-500 hover:text-gray-700 focus:outline-none text-sm font-medium"
              onClick={onClose}
              aria-label={t('search:cancel', 'Cancel')}
            >
              {t('search:cancel', 'Cancel')}
            </button>
          </div>

          {/* Content */}
          <div className="mt-3">
            {/* Header */}
            <div className="text-center">
              <h3 id="seller-type-modal-title" className="text-xl font-medium text-gray-900 mb-1">
                {t('search:sellerType', 'Seller Type')}
              </h3>
            </div>
            
            {/* Seller Type Options */}
            <div className="space-y-2 mt-6">
              {sellerTypes.map(sellerType => {
                const isSelected = selectedSellerTypeId === sellerType.id;
                const displayName = currentLanguage === 'ar' ? sellerType.displayNameAr : sellerType.displayNameEn;
                const count = sellerTypeCounts[sellerType.name] || 0;
                
                return (
                  <div
                    key={sellerType.id}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 rounded-md px-2"
                    onClick={() => onSellerTypeChange(isSelected ? undefined : sellerType.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSellerTypeChange(isSelected ? undefined : sellerType.id);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Checkbox */}
                      <div 
                        className={`w-5 h-5 border-2 rounded transition-all ${
                          isSelected 
                            ? 'border-gray-400 bg-gray-400' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        role="checkbox"
                        aria-checked={isSelected}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </div>
                      
                      {/* Label with Count */}
                      <label className="text-gray-900 cursor-pointer text-base font-normal">
                        {displayName} <span className="text-gray-500 font-normal">({count.toLocaleString()})</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={onClearFilter}
                className="rounded-md bg-white px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                {t('search:clearFilter', 'Clear filter')}
              </button>
              
              <button
                onClick={onClose}
                className="rounded-md bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t('search:showResults', 'Show {{count}} results', { count: totalResults })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerTypeModal;
