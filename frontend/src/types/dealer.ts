export interface DealerStats {
  totalListings: number;
  activeListings: number;
  soldCount: number;
}

export interface PublicDealerProfile {
  id: number;
  businessName: string;
  businessPhone?: string;
  tradingAddress?: string;
  logoUrl?: string;
  bannerUrl?: string;
  memberSince?: string;
  description?: string;
  descriptionAr?: string;
  workingHours?: string;
  socialLinks?: string;
  stats?: DealerStats;
}

export interface DealerListingsResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}
