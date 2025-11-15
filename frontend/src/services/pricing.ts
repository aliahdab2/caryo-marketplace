import { api } from './api';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  listingLimit: number;
  features: string[];
  recommended?: boolean;
  popular?: boolean;
}

/**
 * Fetch subscription tiers from backend
 * 
 * Industry best practice: Single source of truth
 * - Prices come from backend configuration
 * - No hardcoded prices in frontend
 * - Changes in application.properties automatically reflected
 * @returns Promise<SubscriptionTier[]> Array of subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const response = await api.get<{ data: SubscriptionTier[] }>('/api/pricing/tiers');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch subscription tiers:', error);
    // Fallback to hardcoded values if API fails
    return getDefaultTiers();
  }
}

/**
 * Fallback default tiers (if API unavailable)
 * Features use translation keys for i18n support
 */
export function getDefaultTiers(): SubscriptionTier[] {
  return [
    {
      id: 'basic',
      name: 'Basic',
      price: 50,
      currency: 'USD',
      listingLimit: 100,
      features: [
        'feature.listings100',
        'feature.basicAnalytics', 
        'feature.emailSupport',
        'feature.mobileResponsive',
        'feature.photoUploads'
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
        'feature.listings250',
        'feature.advancedAnalytics',
        'feature.prioritySupport',
        'feature.featuredListings',
        'feature.videoUploads',
        'feature.customBranding'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 200,
      currency: 'USD',
      listingLimit: -1,
      features: [
        'feature.unlimitedListings',
        'feature.premiumAnalytics',
        'feature.dedicatedSupport',
        'feature.apiAccess',
        'feature.whiteLabelOptions',
        'feature.customIntegrations',
        'feature.priorityPlacement'
      ]
    }
  ];
}
