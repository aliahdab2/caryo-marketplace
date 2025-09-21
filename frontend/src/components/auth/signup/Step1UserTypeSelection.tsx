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
  sellerTypes: _sellerTypes,
  selectedSellerType,
  setSelectedSellerType,
  setDealerIntent,
  loading: _loading = false
}: Step1UserTypeSelectionProps) {
  const { t } = useTranslation('auth');
  const { dir, textAlign, getInlineStyles } = useRTL();

  const handleSellerTypeSelect = (sellerType: string) => {
    setSelectedSellerType(sellerType);

    // Set dealer intent for age validation
    if (setDealerIntent) {
      setDealerIntent(sellerType === 'dealer');
    }
  };

  // Optimized inline styles using the new helper
  const inlineStyles = getInlineStyles();

  // Enhanced seller type data with icons and improved copy
  const enhancedSellerTypes = [
    {
      id: 1,
      name: 'private',
      icon: '🚗',
      title: t('privateSeller', 'Private Seller'),
      description: t('privateSellerImprovedDesc', 'Designed for selling your personal cars'),
      badge: t('personalUse', 'Personal Use'),
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      features: [
        t('privateSellerFeature1', 'Sell personal cars'),
        t('privateSellerFeature2', 'Simple registration'),
        t('privateSellerFeature3', 'Direct communication')
      ]
    },
    {
      id: 2,
      name: 'dealer',
      icon: '🏢',
      title: t('dealer', 'Dealer'),
      description: t('dealerImprovedDesc', 'Designed for car dealerships and showrooms'),
      badge: t('businessUse', 'Business Use'),
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      features: [
        t('dealerFeature1', 'Bulk car listings'),
        t('dealerFeature2', 'Business verification'),
        t('dealerFeature3', 'Advanced features')
      ]
    }
  ];

  return (
    <div className="space-y-6" dir={dir} style={inlineStyles}>
      {/* Enhanced Header Section */}
      <div className="text-center" dir={dir} style={inlineStyles}>
        <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-3 ${textAlign}`}>
          {t('chooseAccountType', 'Choose Your Account Type')}
        </h3>
        <p className={`text-base text-gray-600 dark:text-gray-400 ${textAlign} max-w-md mx-auto`}>
          {t('accountTypeDescription', 'Select the type of account that best fits your needs')}
        </p>
      </div>

      {/* Enhanced Seller Type Cards */}
      <div className="grid grid-cols-1 gap-6" dir={dir}>
        {enhancedSellerTypes.map((sellerType) => (
          <div
            key={sellerType.id}
            onClick={() => handleSellerTypeSelect(sellerType.name)}
            dir={dir}
            className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 transform hover:scale-[1.02] ${
              selectedSellerType === sellerType.name
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md bg-white dark:bg-gray-800'
            }`}
            style={inlineStyles}
          >
            {/* Selection Indicator */}
            {selectedSellerType === sellerType.name && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className="flex items-start space-x-4 rtl:space-x-reverse" dir={dir}>
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center text-3xl shadow-inner">
                  {sellerType.icon}
                </div>
              </div>

              {/* Content */}
              <div className={`flex-1 min-w-0 ${textAlign}`} dir={dir} style={inlineStyles}>
                {/* Title and Badge */}
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-lg font-bold text-gray-900 dark:text-white ${textAlign}`}>
                    {sellerType.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sellerType.badgeColor}`}>
                    {sellerType.badge}
                  </span>
                </div>

                {/* Description */}
                <p className={`text-sm text-gray-600 dark:text-gray-400 mb-4 ${textAlign} leading-relaxed`}>
                  {sellerType.description}
                </p>

                {/* Enhanced Features List */}
                <div className="space-y-2">
                  {sellerType.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 rtl:space-x-reverse"
                      dir={dir}
                      style={inlineStyles}
                    >
                      {/* Enhanced Checkmark */}
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>

                      {/* Feature Text */}
                      <span className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${textAlign}`} dir={dir} style={inlineStyles}>
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
