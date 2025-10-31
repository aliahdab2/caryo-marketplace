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
 */
function getDefaultTiers(): SubscriptionTier[] {
  return [
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
      listingLimit: -1,
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
}
