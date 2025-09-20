import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/hooks/useRTL';

export interface SellerType {
  id: number;
  name: string;
  title: string;
  description: string;
  features: string[];
}

interface Step1UserTypeSelectionProps {
  sellerTypes: SellerType[];
  selectedSellerType: string;
  setSelectedSellerType: (type: string) => void;
  setDealerIntent?: (intent: boolean) => void;
  loading?: boolean;
}

/**
 * Step 1: User Type Selection Component
 * Displays seller type options with comprehensive RTL support
 */
export default function Step1UserTypeSelection({
  sellerTypes,
  selectedSellerType,
  setSelectedSellerType,
  setDealerIntent,
  loading: _loading = false
}: Step1UserTypeSelectionProps) {
  const { t } = useTranslation('auth');
  const { dir, textAlign, flexDirection, spaceX, getInlineStyles } = useRTL();

  const handleSellerTypeSelect = (sellerType: string) => {
    setSelectedSellerType(sellerType);

    // Set dealer intent for age validation
    if (setDealerIntent) {
      setDealerIntent(sellerType === 'dealer');
    }
  };

  // Optimized inline styles using the new helper
  const inlineStyles = getInlineStyles();

  return (
    <div className="space-y-6" dir={dir} style={inlineStyles}>
      {/* Header Section */}
      <div className="text-center" dir={dir} style={inlineStyles}>
        <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${textAlign}`}>
          {t('chooseAccountType', 'Choose Your Account Type')}
        </h3>
        <p className={`text-sm text-gray-600 dark:text-gray-400 ${textAlign}`}>
          {t('accountTypeDescription', 'Select the type of account that best fits your needs')}
        </p>
      </div>

      {/* Seller Type Cards */}
      <div className="grid grid-cols-1 gap-4" dir={dir}>
        {[...sellerTypes].sort((a, b) => {
          if (a.name === 'private') return -1;
          if (b.name === 'private') return 1;
          return 0;
        }).map((sellerType) => (
          <div
            key={sellerType.id}
            onClick={() => handleSellerTypeSelect(sellerType.name)}
            dir={dir}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
              selectedSellerType === sellerType.name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
            }`}
            style={inlineStyles}
          >
            <div className={`flex items-start ${spaceX('3')}`}>
              {/* Radio Button */}
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
                selectedSellerType === sellerType.name
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedSellerType === sellerType.name && (
                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Card Content */}
              <div className={`flex-1 min-w-0 ${textAlign}`} dir={dir} style={inlineStyles}>
                {/* Title */}
                <h4 className={`text-base font-medium text-gray-900 dark:text-white mb-1 ${textAlign}`}>
                  {sellerType.title}
                </h4>

                {/* Description */}
                <p className={`text-sm text-gray-600 dark:text-gray-400 mb-3 ${textAlign}`}>
                  {sellerType.description}
                </p>

                {/* Features List */}
                <div className="space-y-1">
                  {sellerType.features.map((feature, index) => (
                    <div
                      key={index}
                      className={`flex items-center text-sm text-gray-600 dark:text-gray-400 ${flexDirection} ${spaceX('2')}`}
                      dir={dir}
                      style={inlineStyles}
                    >
                      {/* Checkmark Icon */}
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>

                      {/* Feature Text */}
                      <span className={textAlign} dir={dir} style={inlineStyles}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
