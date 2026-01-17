import React from 'react';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  isCurrentPlan: boolean;
  onUpgrade?: () => void;
  recommended?: boolean;
  tierKey: string;
}

export default function SubscriptionPlanCard({
  name,
  price,
  period,
  features,
  isCurrentPlan,
  onUpgrade,
  recommended = false,
}: SubscriptionPlanCardProps) {
  const { t } = useTranslation('subscription');

  return (
    <div className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
      isCurrentPlan 
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 ring-opacity-50' 
        : recommended
          ? 'border-purple-500 shadow-lg scale-105 z-10 bg-white dark:bg-gray-800'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
    }`}>
      {recommended && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            {t('recommended', 'Recommended')}
          </span>
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{price}</span>
          <span className="text-gray-500 dark:text-gray-400 ms-1">/{period}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-green-500 me-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-default flex items-center justify-center"
          >
            <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {t('currentPlan', 'Current Plan')}
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
              recommended
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                : 'bg-white dark:bg-gray-800 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700'
            }`}
          >
            {t('upgrade', 'Upgrade')}
          </button>
        )}
      </div>
    </div>
  );
}
