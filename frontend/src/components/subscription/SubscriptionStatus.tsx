import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrialStatus } from '@/services/dealerApi';

interface SubscriptionStatusProps {
  trialStatus: TrialStatus;
  loading?: boolean;
}

export default function SubscriptionStatus({ trialStatus, loading = false }: SubscriptionStatusProps) {
  const { t } = useTranslation('subscription');

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  const {
    listingsUsed,
    listingsLimit,
    usagePercent,
    subscriptionTier,
    daysRemaining,
    active
  } = trialStatus;

  // Determine status color based on usage
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const isUnlimited = listingsLimit === -1;
  const displayLimit = isUnlimited ? '∞' : listingsLimit;
  const percent = isUnlimited ? 0 : Math.min(100, Math.max(0, usagePercent));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            {t('subscriptionStatus', 'Subscription Status')}
            <span className={`ms-3 px-3 py-1 rounded-full text-xs font-semibold uppercase ${
              active 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {subscriptionTier === 'trial' ? t('trial', 'Trial') : subscriptionTier}
            </span>
          </h2>
          {subscriptionTier === 'trial' && active && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('trialExpiring', 'Trial expires in {{days}} days', { days: daysRemaining })}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm font-medium mb-1">
            <span className="text-gray-700 dark:text-gray-300">{t('listingsUsage', 'Listings Usage')}</span>
            <span className="text-gray-900 dark:text-white">
              {listingsUsed} / {displayLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${getUsageColor(percent)}`} 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {isUnlimited 
              ? t('unlimitedListings', 'You have unlimited listings') 
              : t('listingsRemaining', '{{count}} listings remaining', { count: listingsLimit - listingsUsed })}
          </p>
        </div>
      </div>
    </div>
  );
}
