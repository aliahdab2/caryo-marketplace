import { useQuery } from '@tanstack/react-query';
import { getPublicDealerProfile, getPublicDealerListings } from '@/services/publicDealerApi';
import type { PublicDealerProfile, DealerListingsResponse } from '@/types/dealer';
import type { Listing } from '@/types/listings';

export const publicDealerKeys = {
  all: ['publicDealer'] as const,
  profile: (dealerId: number) => [...publicDealerKeys.all, 'profile', dealerId] as const,
  listings: (dealerId: number, page: number) => [...publicDealerKeys.all, 'listings', dealerId, page] as const,
};

export function usePublicDealerProfile(
  dealerId: number, 
  options?: { 
    enabled?: boolean;
    /** Initial data from server component (for hydration) */
    initialData?: PublicDealerProfile;
  }
) {
  return useQuery<PublicDealerProfile>({
    queryKey: publicDealerKeys.profile(dealerId),
    queryFn: () => getPublicDealerProfile(dealerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: options?.enabled ?? true,
    // Use initial data from server if provided (prevents refetch on hydration)
    initialData: options?.initialData,
    initialDataUpdatedAt: options?.initialData ? Date.now() : undefined,
  });
}

export function usePublicDealerListings(
  dealerId: number,
  page = 0,
  size = 12,
  options?: { enabled?: boolean }
) {
  return useQuery<DealerListingsResponse<Listing>>({
    queryKey: publicDealerKeys.listings(dealerId, page),
    queryFn: () => getPublicDealerListings(dealerId, page, size),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
