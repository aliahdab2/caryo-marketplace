/**
 * React Query hooks for dealer operations
 * 
 * These hooks provide caching and loading/error states
 * for all dealer-related operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDealerTrialStatus,
  canCreateListing,
  getDealerProfile,
  updateDealerProfile,
  getPaymentHistory,
  getPaymentStatus,
  createSubscription,
  TrialStatus,
  DealerFeatureNotAvailableError,
} from '@/services/dealerApi';

// Query key factory for consistent cache key management
export const dealerKeys = {
  all: ['dealer'] as const,
  trial: () => [...dealerKeys.all, 'trial'] as const,
  profile: () => [...dealerKeys.all, 'profile'] as const,
  publicProfile: () => [...dealerKeys.all, 'publicProfile'] as const,
  canCreate: () => [...dealerKeys.all, 'canCreate'] as const,
  payments: () => [...dealerKeys.all, 'payments'] as const,
  paymentHistory: () => [...dealerKeys.payments(), 'history'] as const,
  paymentStatus: (transactionId: string) => [...dealerKeys.payments(), 'status', transactionId] as const,
};

/**
 * Hook to fetch dealer trial status
 * 
 * Returns null for non-dealers (404 response) without throwing an error.
 * This allows the dashboard to work for all users, not just dealers.
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: trialStatus, isLoading } = useDealerTrialStatus();
 * if (trialStatus) { // show trial banner }
 */
export function useDealerTrialStatus(options?: { enabled?: boolean }) {
  return useQuery<TrialStatus | null>({
    queryKey: dealerKeys.trial(),
    queryFn: async (): Promise<TrialStatus | null> => {
      try {
        return await getDealerTrialStatus();
      } catch (error) {
        // Return null for non-dealer users - this is expected
        // The dashboard works fine without trial status
        if (error instanceof DealerFeatureNotAvailableError) {
          return null;
        }
        // Also handle 404 HTTP errors
        const httpError = error as { status?: number; response?: { status?: number } };
        if (httpError?.status === 404 || httpError?.response?.status === 404) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - trial status can change
    gcTime: 10 * 60 * 1000,
    retry: false, // Don't retry - 404 is expected for non-dealers
    ...options,
  });
}

/**
 * Hook to check if dealer can create a new listing
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data } = useCanCreateListing();
 * if (data?.canCreate) { // show create button }
 */
export function useCanCreateListing(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealerKeys.canCreate(),
    queryFn: canCreateListing,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch dealer profile
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: profile, isLoading } = useDealerProfile();
 */
export function useDealerProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealerKeys.profile(),
    queryFn: getDealerProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch payment history
 * 
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: payments, isLoading } = usePaymentHistory();
 */
export function usePaymentHistory(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dealerKeys.paymentHistory(),
    queryFn: getPaymentHistory,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch status of a specific payment
 * 
 * @param transactionId - The transaction ID to check
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: status, isLoading } = usePaymentStatus('txn123');
 */
export function usePaymentStatus(
  transactionId: string | undefined,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: dealerKeys.paymentStatus(transactionId!),
    queryFn: () => getPaymentStatus(transactionId!),
    enabled: !!transactionId && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds - payment status changes
    gcTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval, // Allow polling for pending payments
  });
}

/**
 * Mutation hook to create a subscription
 * 
 * @example
 * const subscribeMutation = useCreateSubscription();
 * const result = await subscribeMutation.mutateAsync('Professional');
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tier: string) => createSubscription(tier),
    onSuccess: () => {
      // Invalidate dealer-related queries as subscription affects them
      queryClient.invalidateQueries({ queryKey: dealerKeys.all });
    },
  });
}

/**
 * Mutation hook to update dealer profile
 */
export function useUpdateDealerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDealerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealerKeys.profile() });
      queryClient.invalidateQueries({ queryKey: dealerKeys.publicProfile() });
    },
  });
}
