'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdClose, 
  MdCheck, 
  MdStar,
  MdDirectionsCar,
  MdTrendingUp,
  MdBusinessCenter,
  MdPayment,
  MdInfo
} from 'react-icons/md';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  listingLimit: number;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onSelectTier?: (tierId: string) => void;
  className?: string;
}

const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 50,
    currency: 'USD',
    listingLimit: 100,
    features: [
      'Up to 100 listings',
      'Basic analytics',
      'Email support',
      'Mobile responsive',
      'Photo uploads'
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 100,
    currency: 'USD',
    listingLimit: 250,
    recommended: true,
    popular: true,
    features: [
      'Up to 250 listings',
      'Advanced analytics',
      'Priority support',
      'Featured listings',
      'Video uploads',
      'Custom branding'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 200,
    currency: 'USD',
    listingLimit: -1, // Unlimited
    features: [
      'Unlimited listings',
      'Premium analytics',
      'Dedicated support',
      'API access',
      'White-label options',
      'Custom integrations',
      'Priority placement'
    ]
  }
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentTier: _currentTier = 'trial',
  onSelectTier,
  className = '' 
}: UpgradeModalProps) {
  const { t } = useTranslation(['dashboard', 'common']);
  const [selectedTier, setSelectedTier] = useState<string>('advanced');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const handleUpgrade = async () => {
    if (!onSelectTier) {
      // Default behavior - show coming soon message
      alert(t('upgrade.coming.soon'));
      return;
    }

    setIsProcessing(true);
    try {
      await onSelectTier(selectedTier);
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
      alert(t('upgrade.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'basic':
        return <MdDirectionsCar className="w-6 h-6" />;
      case 'advanced':
        return <MdTrendingUp className="w-6 h-6" />;
      case 'professional':
        return <MdBusinessCenter className="w-6 h-6" />;
      default:
        return <MdDirectionsCar className="w-6 h-6" />;
    }
  };

  return (
    <div className={`
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
      flex items-center justify-center p-4
      ${className}
    `}>
      <div className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-2xl
        max-w-4xl w-full max-h-[90vh] overflow-y-auto
        transform transition-all duration-300
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('upgrade.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('upgrade.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Current Trial Info */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <MdInfo className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {t('upgrade.current.trial')}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('upgrade.trial.benefits')}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`
                  relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                  ${selectedTier === tier.id
                    ? 'border-primary bg-primary/5 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-md'
                  }
                  ${tier.popular ? 'ring-2 ring-primary/20' : ''}
                `}
                onClick={() => handleSelectTier(tier.id)}
              >
                {/* Popular Badge */}
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <MdStar className="w-3 h-3" />
                      <span>{t('upgrade.popular')}</span>
                    </div>
                  </div>
                )}

                {/* Recommended Badge */}
                {tier.recommended && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {t('upgrade.recommended')}
                    </div>
                  </div>
                )}

                {/* Tier Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className={`
                      p-3 rounded-full
                      ${selectedTier === tier.id 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }
                    `}>
                      {getTierIcon(tier.id)}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${tier.price}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      /{t('upgrade.per.month')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {tier.listingLimit === -1 
                      ? t('upgrade.unlimited.listings')
                      : t('upgrade.listings.limit', { count: tier.listingLimit })
                    }
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <MdCheck className={`
                        w-4 h-4 flex-shrink-0
                        ${selectedTier === tier.id 
                          ? 'text-primary' 
                          : 'text-green-500'
                        }
                      `} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <button
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200
                    ${selectedTier === tier.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {selectedTier === tier.id 
                    ? t('upgrade.selected') 
                    : t('upgrade.select.plan')
                  }
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>{t('upgrade.secure.payment')}</p>
              <p className="mt-1">{t('upgrade.cancel.anytime')}</p>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2 rtl:space-x-reverse"
              >
                <MdPayment className="w-4 h-4" />
                <span>
                  {isProcessing 
                    ? t('upgrade.processing') 
                    : t('upgrade.continue')
                  }
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
