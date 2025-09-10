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

export default function Step1UserTypeSelection({
  sellerTypes,
  selectedSellerType,
  setSelectedSellerType,
  setDealerIntent,
  loading: _loading = false
}: Step1UserTypeSelectionProps) {
  const { t } = useTranslation('auth');

  const handleSellerTypeSelect = (sellerType: string) => {
    setSelectedSellerType(sellerType);

    // Set dealer intent for age validation
    if (setDealerIntent) {
      setDealerIntent(sellerType === 'dealer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('chooseAccountType', 'Choose Your Account Type')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('accountTypeDescription', 'Select the type of account that best fits your needs')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[...sellerTypes].sort((a, b) => {
          if (a.name === 'private') return -1;
          if (b.name === 'private') return 1;
          return 0;
        }).map((sellerType) => (
          <div
            key={sellerType.id}
            onClick={() => handleSellerTypeSelect(sellerType.name)}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
              selectedSellerType === sellerType.name
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 ${
                selectedSellerType === sellerType.name
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedSellerType === sellerType.name && (
                  <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  {sellerType.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {sellerType.description}
                </p>

                <div className="space-y-1">
                  {sellerType.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
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
