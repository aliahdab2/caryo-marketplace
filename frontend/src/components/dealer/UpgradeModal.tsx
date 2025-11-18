'use client';

import React, { useState, useEffect } from 'react';
import type { IconType } from 'react-icons';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/utils/direction';
import { 
  MdClose, 
  MdCheck, 
  MdStar,
  MdDirectionsCar,
  MdTrendingUp,
  MdBusinessCenter,
  MdPayment,
  MdInfo,
  MdAccountBalance,
  MdSupportAgent,
  MdVerified
} from 'react-icons/md';
import { FaPaypal } from 'react-icons/fa';
import { getSubscriptionTiers, getDefaultTiers, type SubscriptionTier } from '@/services/pricing';

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

interface SummaryFeature {
  icon: IconType;
  titleKey: string;
  descriptionKey: string;
  accentClass: string;
}

const _SUMMARY_FEATURES: SummaryFeature[] = [
  {
    icon: MdTrendingUp,
    titleKey: 'upgradeModal:summaryVisibilityTitle',
    descriptionKey: 'upgradeModal:summaryVisibilityDescription',
    accentClass: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200'
  },
  {
    icon: MdVerified,
    titleKey: 'upgradeModal:summaryTrustTitle',
    descriptionKey: 'upgradeModal:summaryTrustDescription',
    accentClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
  },
  {
    icon: MdSupportAgent,
    titleKey: 'upgradeModal:summarySupportTitle',
    descriptionKey: 'upgradeModal:summarySupportDescription',
    accentClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200'
  }
];

const _TRUST_METRICS = [
  { value: '3x', labelKey: 'upgradeModal:metricLeads' },
  { value: '+72%', labelKey: 'upgradeModal:metricMarketshare' },
  { value: '24/7', labelKey: 'upgradeModal:metricSupport' }
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentTier: _currentTier = 'trial',
  onSelectPayment: _onSelectPayment,
  className = '',
  availablePaymentMethods: _availablePaymentMethods = ['paypal', 'manual_transfer']
}: UpgradeModalProps) {
  const { t } = useTranslation(['upgradeModal', 'common', 'payment']);
  const { isRTL } = useDirection();
  // Start with default tiers immediately - no loading delay!
  const [subscriptionTiers, setSubscriptionTiers] = useState<SubscriptionTier[]>(getDefaultTiers());
  const [selectedTier, setSelectedTier] = useState<string>('advanced');
  const [_selectedPaymentMethod, _setSelectedPaymentMethod] = useState<string>('manual_transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [_step, _setStep] = useState<'plan' | 'payment'>('plan');

  // Fetch tiers from backend in background - updates silently
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
          // Keep default tiers on error - they should already be correct
        });
    }
  }, [isOpen]);

  // ESC key to close modal (accessibility best practice)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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
      alert(t('upgradeModal:comingSoon'));
      return;
    }

    // For now, use manual transfer as the default payment method
    const defaultPaymentMethod = 'manual_transfer';
    
    try {
      setIsProcessing(true);
      
      // Call the payment handler with proper error handling
      await _onSelectPayment(selectedTier, defaultPaymentMethod);
      
      // Close modal on success (the parent component handles success/error messages)
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
      
      // More user-friendly error display
      const errorMessage = error instanceof Error 
        ? error.message 
        : t('upgradeModal:error');
        
      alert(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tierId: string, isSelected: boolean = false) => {
    // Use pure white when selected with inline style for guaranteed visibility
    const iconStyle = isSelected 
      ? { color: '#ffffff', fill: '#ffffff' } 
      : undefined;
    
    const baseClass = isSelected 
      ? 'w-6 h-6 !text-white' 
      : 'w-6 h-6 text-gray-600 dark:text-gray-400';
    
    switch (tierId) {
      case 'basic':
        return <MdDirectionsCar className={baseClass} style={iconStyle} />;
      case 'advanced':
        return <MdTrendingUp className={baseClass} style={iconStyle} />;
      case 'professional':
        return <MdBusinessCenter className={baseClass} style={iconStyle} />;
      default:
        return <MdDirectionsCar className={baseClass} style={iconStyle} />;
    }
  };

  return (
    <div className={`
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 
      flex items-center justify-center p-4
      ${className}
    `}>
      <div 
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`
        bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
        max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col
        transform transition-all duration-300
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Header - More compact */}
        <div className="relative flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white !text-gray-900 dark:!text-white">
              {t('upgradeModal:title')}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 !text-gray-600 dark:!text-gray-400">
              {t('upgradeModal:subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <MdClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Current Trial Info - More compact */}
        <div className="px-6 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center gap-2">
            <MdInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-900 dark:text-blue-100">
              {t('upgradeModal:currentTrialTitle')} • <span className="text-blue-700 dark:text-blue-300">{t('upgradeModal:currentTrialDescription')}</span>
            </p>
          </div>
        </div>

        {/* Pricing Tiers - Compact, no scrolling, RTL support */}
        <div className="p-4 flex-shrink-0">
          <div className="grid md:grid-cols-3 gap-3 items-stretch">
              {subscriptionTiers.map((tier) => (
              <div
                key={tier.id}
                className={`
                  relative border-2 rounded-xl p-3 cursor-pointer transition-all duration-300
                  flex flex-col h-full group
                  ${selectedTier === tier.id
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 shadow-xl scale-[1.02] ring-2 ring-primary/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:shadow-lg hover:scale-[1.01] bg-white dark:bg-gray-800/50'
                  }
                  ${tier.popular ? 'ring-2 ring-primary/20 shadow-lg' : ''}
                `}
                onClick={() => handleSelectTier(tier.id)}
              >
                {/* Popular Badge - More compact with high contrast */}
                {tier.popular && (
                  <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-lg">
                      <MdStar className="w-3 h-3 fill-current" />
                      <span>{t('upgradeModal:badgePopular')}</span>
                    </div>
                  </div>
                )}

                {/* Recommended Badge */}
                {tier.recommended && (
                  <div className="absolute top-2 end-2 z-10">
                    <div className="bg-green-500 text-white px-2 py-0.5 rounded text-[9px] font-bold shadow-md">
                      {t('upgradeModal:badgeRecommended')}
                    </div>
                  </div>
                )}

                {/* Tier Header - Compact */}
                <div className="text-center mb-3 pt-1">
                  <div className="flex justify-center mb-2">
                    <div className={`
                      p-2 rounded-xl transition-all duration-300
                      ${selectedTier === tier.id 
                        ? 'bg-blue-600 shadow-md scale-105' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 group-hover:scale-105'
                      }
                    `}>
                      {getTierIcon(tier.id, selectedTier === tier.id)}
                    </div>
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                    {t(`upgradeModal:tier.${tier.id}`)}
                  </h3>
                  
                  {/* Price - Compact */}
                  <div className="mb-1.5">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      ${tier.price}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                      /{t('upgradeModal:pricePerMonth')}
                    </span>
                  </div>
                  
                  {/* Listing Limit */}
                  <div className={`
                    inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold
                    ${selectedTier === tier.id 
                      ? 'bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-light' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    {tier.listingLimit === -1 
                      ? t('upgradeModal:unlimitedListings')
                      : t('upgradeModal:listingLimit', { count: tier.listingLimit })
                    }
                  </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-2" />

                {/* Features List - Compact with RTL support */}
                <ul className="space-y-1 mb-3 flex-1">
                  {tier.features.map((feature, index) => {
                    // Backend may return "upgradeModal:feature.listings100" or just "feature.listings100"
                    // Strip namespace prefix if present, then add it back for translation
                    const cleanKey = feature.includes(':') ? feature.split(':')[1] : feature;
                    return (
                      <li key={index} className="flex items-start gap-1.5 group/item">
                        <MdCheck className={`
                          w-3.5 h-3.5 flex-shrink-0 mt-0.5 transition-colors
                          ${selectedTier === tier.id 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-green-500 group-hover/item:text-green-600'
                          }
                        `} />
                        <span className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug">
                          {t(`upgradeModal:${cleanKey}`)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Select Button - Compact */}
                <button
                  className={`
                    w-full py-2 px-3 rounded-lg font-bold transition-all duration-300 text-xs
                    shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                    ${selectedTier === tier.id
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-primary/30'
                      : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 hover:from-gray-200 hover:to-gray-100 dark:hover:from-gray-600 dark:hover:to-gray-700'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTier(tier.id);
                  }}
                >
                  {selectedTier === tier.id 
                    ? `✓ ${t('upgradeModal:selected')}` 
                    : t('upgradeModal:selectPlan')
                  }
                </button>
              </div>
              ))}
            </div>
        </div>

        {/* Footer - Compact */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Left: Trust signals */}
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <MdCheck className="w-3.5 h-3.5 text-green-500" />
                <span>{t('upgradeModal:securePayment')}</span>
              </div>
              <div className="hidden md:block w-px h-3 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-1">
                <MdCheck className="w-3.5 h-3.5 text-green-500" />
                <span>{t('upgradeModal:cancelAnytime')}</span>
              </div>
            </div>
            
            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 md:flex-none px-5 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common:cancel')}
              </button>
              
              <button
                onClick={handleUpgrade}
                disabled={isProcessing}
                className="flex-1 md:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 !bg-blue-600 !text-white border-0"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('upgradeModal:processing')}</span>
                  </>
                ) : (
                  <>
                    <MdPayment className="w-3.5 h-3.5" />
                    <span>{t('upgradeModal:continue')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
