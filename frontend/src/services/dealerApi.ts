import { apiRequest } from '@/services/auth/session-manager';

export interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  isInGracePeriod: boolean;
  daysRemaining: number;
  listingsUsed: number;
  listingsLimit: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  trialEndDate: string;
  gracePeriodEndDate?: string;
  trialStartedAt: string;
  timezone: string;
}

export interface CanCreateListingResponse {
  canCreate: boolean;
  reason: string;
  trialStatus: TrialStatus;
}

export interface DealerProfile {
  id: number;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  vatNumber?: string;
  tradingAddress?: string;
  logoUrl?: string;
  trialStatus: TrialStatus;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

/**
 * Get current dealer's trial status
 */
export async function getDealerTrialStatus(): Promise<TrialStatus> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/dealer/trial-status`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch trial status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dealer trial status:', error);
    throw error;
  }
}

/**
 * Check if dealer can create a new listing
 */
export async function canCreateListing(): Promise<CanCreateListingResponse> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/dealer/can-create-listing`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to check listing permission: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking listing permission:', error);
    throw error;
  }
}

/**
 * Get dealer profile information
 */
export async function getDealerProfile(): Promise<DealerProfile> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/dealer/profile`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dealer profile: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dealer profile:', error);
    throw error;
  }
}

/**
 * Request trial extension (admin only)
 */
export async function extendTrial(dealerId: number, extensionDays: number): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/dealer/extend-trial/${dealerId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ extensionDays }),
    });

    if (!response.ok) {
      throw new Error(`Failed to extend trial: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error extending trial:', error);
    throw error;
  }
}

/**
 * Create a subscription payment
 */
export async function createSubscription(tier: string): Promise<{ success: boolean; paymentInstructions?: string; transactionId?: string }> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/payments/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId: 'manual_transfer',
        tier: tier,
        paymentMethodDetails: {
          type: 'BANK_TRANSFER'
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create subscription: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      paymentInstructions: data.message,
      transactionId: data.transactionId
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Get payment history for the dealer
 */
export async function getPaymentHistory(): Promise<unknown[]> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/payments/history`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment history: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
}

/**
 * Check payment status
 */
export async function getPaymentStatus(transactionId: string): Promise<unknown> {
  try {
    const response = await apiRequest(`${API_BASE_URL}/api/payments/${transactionId}/status`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
}

/**
 * Hook for managing dealer trial state
 */
export function useDealerTrial() {
  // This could be expanded to use React Query or SWR for caching
  // For now, it's a simple wrapper around the API calls
  
  const refreshTrialStatus = async () => {
    return await getDealerTrialStatus();
  };

  const checkListingPermission = async () => {
    return await canCreateListing();
  };

  const upgradeSubscription = async (tier: string) => {
    return await createSubscription(tier);
  };

  return {
    refreshTrialStatus,
    checkListingPermission,
    upgradeSubscription,
    getDealerProfile,
    getPaymentHistory,
    getPaymentStatus
  };
}
