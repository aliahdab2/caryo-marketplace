'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdWarning, 
  MdCheckCircle, 
  MdError, 
  MdUpgrade,
  MdTimer,
  MdDirectionsCar 
} from 'react-icons/md';
import { useDirection } from '@/utils/direction';

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
  listingsUsed: number;
  listingsLimit: number;
  subscriptionTier: string;
  trialEndDate: string;
  gracePeriodEndDate?: string;
}

interface TrialBannerProps {
  trialStatus: TrialStatus;
  onUpgradeClick?: () => void;
  className?: string;
}

export default function TrialBanner({ 
  trialStatus, 
  onUpgradeClick,
  className = '' 
}: TrialBannerProps) {
  const { t } = useTranslation(['dashboard', 'common']);

  // Don't show banner for paid subscribers
  if (trialStatus.subscriptionTier !== 'trial') {
    return null;
  }

  // Determine banner type and styling
  const getBannerConfig = () => {
    const { isActive, isExpired, isInGracePeriod, daysRemaining, listingsUsed, listingsLimit } = trialStatus;
    
    // Expired - Critical
    if (isExpired && !isInGracePeriod) {
      return {
        type: 'expired',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        icon: <MdError className="w-5 h-5" />,
        title: t('trial.expired.title'),
        message: t('trial.expired.message'),
        actionText: t('trial.upgrade.now'),
        urgent: true
      };
    }

    // Grace period - Warning
    if (isInGracePeriod) {
      return {
        type: 'grace',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-800 dark:text-orange-200',
        icon: <MdWarning className="w-5 h-5" />,
        title: t('trial.grace.title'),
        message: t('trial.grace.message', { days: daysRemaining }),
        actionText: t('trial.upgrade.now'),
        urgent: true
      };
    }

    // High usage (90%+) - Warning
    const usagePercent = (listingsUsed / listingsLimit) * 100;
    if (usagePercent >= 90) {
      return {
        type: 'high-usage',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        icon: <MdWarning className="w-5 h-5" />,
        title: t('trial.usage.high.title'),
        message: t('trial.usage.high.message', { 
          remaining: listingsLimit - listingsUsed,
          total: listingsLimit 
        }),
        actionText: t('trial.upgrade.soon'),
        urgent: false
      };
    }

    // Low time (7 days or less) - Info
    if (daysRemaining <= 7) {
      return {
        type: 'low-time',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-800 dark:text-blue-200',
        icon: <MdTimer className="w-5 h-5" />,
        title: t('trial.time.low.title'),
        message: t('trial.time.low.message', { days: daysRemaining }),
        actionText: t('trial.upgrade.consider'),
        urgent: false
      };
    }

    // Active trial - Success
    if (isActive) {
      return {
        type: 'active',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-200',
        icon: <MdCheckCircle className="w-5 h-5" />,
        title: t('trial.active.title'),
        message: t('trial.active.message', { 
          days: daysRemaining,
          listings: listingsLimit - listingsUsed 
        }),
        actionText: t('trial.learn.more'),
        urgent: false
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Default action - could navigate to pricing page
      console.log('Upgrade clicked - implement navigation');
    }
  };

  return (
    <div className={`
      ${config.bgColor} ${config.borderColor} ${config.textColor}
      border rounded-lg p-4 mb-6 shadow-sm
      ${config.urgent ? 'animate-pulse' : ''}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 rtl:space-x-reverse">
          <div className={`
            flex-shrink-0 mt-0.5
            ${config.urgent ? 'animate-bounce' : ''}
          `}>
            {config.icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">
              {config.title}
            </h3>
            <p className="text-sm opacity-90 mb-3">
              {config.message}
            </p>
            
            {/* Progress Bar */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MdDirectionsCar className="w-4 h-4" />
                <span>
                  {t('trial.listings.used', { 
                    used: trialStatus.listingsUsed, 
                    total: trialStatus.listingsLimit 
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MdTimer className="w-4 h-4" />
                <span>
                  {t('trial.days.remaining', { days: trialStatus.daysRemaining })}
                </span>
              </div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="mt-2 w-full bg-white/30 rounded-full h-2">
              <div 
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${trialStatus.listingsUsed / trialStatus.listingsLimit >= 0.9 
                    ? 'bg-red-500' 
                    : trialStatus.listingsUsed / trialStatus.listingsLimit >= 0.75 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                  }
                `}
                style={{ 
                  width: `${Math.min((trialStatus.listingsUsed / trialStatus.listingsLimit) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button
          onClick={handleUpgradeClick}
          className={`
            flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-md
            text-sm font-medium transition-all duration-200
            ${config.urgent 
              ? 'bg-white text-red-600 hover:bg-red-50 shadow-md hover:shadow-lg' 
              : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
            }
            hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50
          `}
        >
          <MdUpgrade className="w-4 h-4" />
          <span>{config.actionText}</span>
        </button>
      </div>
    </div>
  );
}
