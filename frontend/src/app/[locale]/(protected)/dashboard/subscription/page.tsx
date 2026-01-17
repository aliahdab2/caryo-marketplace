"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import SubscriptionPlanCard from '@/components/subscription/SubscriptionPlanCard';
import { useDealerTrial, SubscriptionTier, TrialStatus } from '@/services/dealerApi';
import { useToastHelpers } from '@/components/ui/ToastProvider';

export default function SubscriptionPage() {
  const { t } = useTranslation('subscription');
  const { showSuccess, showError } = useToastHelpers();
  const { 
    refreshTrialStatus, 
    upgradeSubscription, 
    getSubscriptionTiers 
  } = useDealerTrial();

  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [status, tiers] = await Promise.all([
          refreshTrialStatus(),
          getSubscriptionTiers()
        ]);
        setTrialStatus(status);
        setPlans(tiers);
      } catch (error) {
        console.error('Failed to load subscription data:', error);
        showError(t('errors.loadFailed', 'Failed to load subscription data'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshTrialStatus, getSubscriptionTiers, showError, t]);

  const handleUpgrade = async (tierId: string) => {
    // Get plan name and price for confirmation message
    const plan = plans.find(p => p.id === tierId);
    const planName = plan?.name || tierId.charAt(0).toUpperCase() + tierId.slice(1);
    const planPrice = plan ? `${plan.price.toLocaleString()} ${plan.currency}` : '';

    // Use translation with interpolation
    const confirmMessage = t('confirmUpgradeMessage', {
      plan: planName,
      price: planPrice,
      defaultValue: `Are you sure you want to upgrade to the ${planName} plan? You will be charged ${planPrice}.`
    });

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const result = await upgradeSubscription(tierId);
      if (result.success) {
        showSuccess(t('upgradeSuccess', 'Subscription upgraded successfully!'));
        // Refresh status to show new limits
        const newStatus = await refreshTrialStatus();
        setTrialStatus(newStatus);
        
        // Show payment instructions if manual transfer
        if (result.paymentInstructions) {
             // In a real app, we might redirect to a "Thank You" or "Instructions" page
             // For now, we'll rely on the toast and potentially a modal in the future
             console.log("Payment Instructions:", result.paymentInstructions);
        }
      } else {
        throw new Error('Upgrade failed');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      showError(t('upgradeError', 'Failed to upgrade subscription. Please try again.'));
    }
  };

  if (loading && !trialStatus) {
    return (
      <div className="p-6 space-y-6">
        <SubscriptionStatus trialStatus={{} as TrialStatus} loading={true} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
             <div key={i} className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('pageTitle', 'Subscription Management')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('pageSubtitle', 'Manage your plan and viewing limits')}
        </p>
      </div>

      {/* Current Status Section */}
      {trialStatus && (
        <SubscriptionStatus trialStatus={trialStatus} />
      )}

      {/* Plans Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          {t('availablePlans', 'Available Plans')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              tierKey={plan.id}
              name={plan.name} // Backend returns "Basic", "Advanced", etc.
              price={`${plan.price.toLocaleString()} ${plan.currency}`}
              period={t('plans.period', 'mo')}
              features={plan.features.map(f => t(f, f))} // Translate backend feature keys
              isCurrentPlan={trialStatus?.subscriptionTier?.toLowerCase() === plan.id.toLowerCase()}
              recommended={plan.recommended}
              onUpgrade={() => handleUpgrade(plan.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
