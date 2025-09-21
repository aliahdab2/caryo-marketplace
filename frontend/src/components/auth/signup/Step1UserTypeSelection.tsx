import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation('auth');
  const isArabic = i18n.language === 'ar';

  const handleSellerTypeSelect = (sellerType: string) => {
    setSelectedSellerType(sellerType);

    // Set dealer intent for age validation
    if (setDealerIntent) {
      setDealerIntent(sellerType === 'dealer');
    }
  };

  // Optimized inline styles using the new helper

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
    <div className="h-full flex flex-col space-y-8">
      {/* Clean title and description */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center" dir={isArabic ? 'rtl' : 'ltr'}>
          {t('chooseAccountType', 'Choose Your Account Type')}
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto" dir={isArabic ? 'rtl' : 'ltr'}>
          {t('accountTypeDescription', 'Select the type of account that best fits your needs')}
        </p>
      </div>

      {/* Prominent Seller Type Cards - Equal Heights */}
      <div className="flex-1 grid grid-cols-1 gap-6">
        {enhancedSellerTypes.map((sellerType) => (
          <div
            key={sellerType.id}
            onClick={() => handleSellerTypeSelect(sellerType.name)}
            className={`relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 flex flex-col h-full min-h-[240px] ${
              selectedSellerType === sellerType.name
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-xl ring-4 ring-blue-500/10'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg bg-white dark:bg-gray-800'
            }`}
          >
            {/* Selection Indicator */}
            <div className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'}`}>
              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                selectedSellerType === sellerType.name
                  ? 'border-blue-500 bg-blue-500 shadow-lg'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}>
                {selectedSellerType === sellerType.name && (
                  <svg className="w-4 h-4 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                  </svg>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full">
              {/* Icon and Header */}
              <div className={`flex items-start mb-6 ${isArabic ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
                <div className="text-5xl flex-shrink-0">{sellerType.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center mb-3 ${isArabic ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <h3 className={`text-2xl font-bold text-gray-900 dark:text-white ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                      {sellerType.title}
                    </h3>
                    <span className={`px-4 py-1.5 text-sm font-semibold rounded-full ${sellerType.badgeColor} flex-shrink-0`}>
                      {sellerType.badge}
                    </span>
                  </div>
                  <p className={`text-lg text-gray-600 dark:text-gray-400 ${isArabic ? 'text-right' : 'text-left'} leading-relaxed`} dir={isArabic ? 'rtl' : 'ltr'}>
                    {sellerType.description}
                  </p>
                </div>
              </div>

              {/* Feature List - Push to bottom */}
              <div className={`mt-auto ${isArabic ? 'text-right' : 'text-left'}`}>
                <div className={`flex flex-wrap gap-3 ${isArabic ? 'justify-end' : 'justify-start'}`}>
                  {sellerType.features.map((feature, index) => (
                    <div key={index} className={`flex items-center bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-2.5 ${isArabic ? 'flex-row-reverse' : 'flex-row'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                      <span className={`text-green-600 dark:text-green-400 ${isArabic ? 'ml-2' : 'mr-2'} text-base`}>✓</span>
                      <span className="text-base text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
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
