/**
 * Custom hook for fetching and managing seller types
 */

import { useQuery } from '@tanstack/react-query';
import { getSellerTypes } from '@/services/sellerTypes';
import { SellerType } from '@/types/sellerTypes';
import { filterPublicSellerTypes, getDefaultSellerTypeId } from '@/utils/sellerTypeUtils';

interface UseSellerTypesOptions {
  /**
   * Whether to filter out certified dealers from the results
   * @default true
   */
  filterCertified?: boolean;
  /**
   * Whether to automatically select the default seller type
   * @default false
   */
  autoSelectDefault?: boolean;
}

interface UseSellerTypesReturn {
  /** Filtered seller types (excludes certified if filterCertified is true) */
  sellerTypes: SellerType[];
  /** Default seller type ID (private) */
  defaultSellerTypeId: number | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Retry function */
  refetch: () => void;
}

/**
 * Hook to fetch and manage seller types with filtering and default selection
 */
export function useSellerTypes(options: UseSellerTypesOptions = {}): UseSellerTypesReturn {
  const { filterCertified = true } = options;

  const {
    data: rawSellerTypes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sellerTypes'],
    queryFn: getSellerTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes - seller types rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
    retry: 2,
  });

  // Filter seller types if needed
  const sellerTypes = filterCertified ? filterPublicSellerTypes(rawSellerTypes) : rawSellerTypes;
  
  // Get default seller type ID
  const defaultSellerTypeId = getDefaultSellerTypeId(sellerTypes);

  return {
    sellerTypes,
    defaultSellerTypeId,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook specifically for signup form - includes auto-selection of default type
 */
export function useSellerTypesForSignup() {
  return useSellerTypes({
    filterCertified: true,
    autoSelectDefault: true,
  });
}

/**
 * Hook for admin interfaces - includes all seller types
 */
export function useAllSellerTypes() {
  return useSellerTypes({
    filterCertified: false,
    autoSelectDefault: false,
  });
}
