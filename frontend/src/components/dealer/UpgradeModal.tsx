'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdClose, 
  MdCheck, 
  MdStar,
  MdDirectionsCar,
  MdTrendingUp,
  MdBusinessCenter,
  MdPayment,
  MdInfo,
  MdAccountBalance
} from 'react-icons/md';
import { FaPaypal } from 'react-icons/fa';
import { getSubscriptionTiers, type SubscriptionTier } from '@/services/pricing';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingFee: number;
  processingTime: string;
  enabled: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: string;
  onSelectPayment?: (tierId: string, paymentMethod: string) => void;
  className?: string;
  availablePaymentMethods?: string[];
}

// Subscription tiers are now fetched from backend API (industry best practice)
// See getSubscriptionTiers() in useEffect below

const _PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'paypal',
    name: 'PayPal',
    icon: <FaPaypal className="w-6 h-6" />,
    description: 'Pay with your PayPal account',
    processingFee: 2.9,
    processingTime: 'Instant',
    enabled: false // Disabled until PayPal access is available
  },
  {
    id: 'manual_transfer',
    name: 'Bank Transfer',
    icon: <MdAccountBalance className="w-6 h-6" />,
    description: 'Manual bank transfer (requires verification)',
    processingFee: 0,
    processingTime: '1-3 business days',
    enabled: true
  }
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentTier: _currentTier = 'trial',
  onSelectPayment: _onSelectPayment,
  className = '',
  availablePaymentMethods: _availablePaymentMethods = ['paypal', 'manual_transfer']
}: UpgradeModalProps) {
  const { t } = useTranslation(['dashboard', 'common', 'payment']);
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('advanced');
  const [_selectedPaymentMethod, _setSelectedPaymentMethod] = useState<string>('manual_transfer');
  const [isProcessing, _setIsProcessing] = useState(false);
  const [_step, _setStep] = useState<'plan' | 'payment'>('plan');
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);

  // Fetch tiers from backend (industry best practice: single source of truth)
  useEffect(() => {
    if (isOpen) {
      getSubscriptionTiers()
        .then(tiers => {
          setSubscriptionTiers(tiers);
          if (tiers.length > 0) {
            // Default to 'advanced' if available, otherwise first tier
            const advancedTier = tiers.find(t => t.id === 'advanced') || tiers[0];
            setSelectedTier(advancedTier.id);
          }
        })
        .catch(error => {
          console.error('Failed to load subscription tiers:', error);
        })
        .finally(() => {
          setIsLoadingTiers(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const _getPaymentIcon = (methodId: string) => {
    switch (methodId) {
      case 'paypal':
        return <FaPaypal className="w-5 h-5" />;
      case 'manual_transfer':
        return <MdAccountBalance className="w-5 h-5" />;
      default:
        return <MdPayment className="w-5 h-5" />;
    }
  };

  const handleUpgrade = async () => {
    if (!_onSelectPayment) {
      // Fallback if no payment handler provided
      alert(t('upgrade.coming.soon'));
      return;
    }

    // For now, use manual transfer as the default payment method
    const defaultPaymentMethod = 'manual_transfer';
    
    try {
      console.log('🚀 Processing upgrade:', { tier: selectedTier, paymentMethod: defaultPaymentMethod });
      
      // Call the payment handler
      await _onSelectPayment(selectedTier, defaultPaymentMethod);
      
      // Close modal on success (the parent component handles success/error messages)
      onClose();
    } catch (error) {
      console.error('❌ Upgrade error:', error);
      alert(t('upgrade.error'));
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
          {isLoadingTiers ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {subscriptionTiers.map((tier) => (
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
          )}
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
