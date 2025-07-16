/**
 * Seller type interface for the frontend
 */
export interface SellerType {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
}

/**
 * Seller type counts interface for filtering
 */
export interface SellerTypeCounts {
  [key: string]: number;  // Can be indexed by seller type name
}

/**
 * API response interface for seller type counts
 */
export interface SellerTypeCountsResponse {
  [key: string]: number;
}

/**
 * API response interface for seller types
 */
export interface SellerTypesResponse {
  content: SellerType[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
