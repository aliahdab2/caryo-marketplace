import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Retrieves view analytics for a specific listing
 * 
 * @param listingId The ID of the car listing
 * @param startDate Optional start date for filtering analytics
 * @param endDate Optional end date for filtering analytics
 * @returns View analytics data including counts and trends
 */
export async function getListingViewAnalytics(
  listingId: number | string, 
  startDate: string | null = null, 
  endDate: string | null = null
) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await axios.get(
    `${API_URL}/analytics/listings/${listingId}/views?${params.toString()}`, 
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Retrieves view analytics for all listings owned by the current user
 * 
 * @returns View analytics data for all user listings
 */
export async function getUserListingsViewAnalytics() {
  const response = await axios.get(
    `${API_URL}/analytics/user/listings/views`, 
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Retrieves aggregated view statistics (daily, weekly, monthly totals)
 * 
 * @returns Aggregated view statistics
 */
export async function getViewStatsSummary() {
  const response = await axios.get(
    `${API_URL}/analytics/views/summary`,
    { withCredentials: true }
  );
  return response.data;
}

/**
 * Retrieves trending listings based on view count
 * 
 * @param limit Number of trending listings to return
 * @returns List of trending listings with their view counts
 */
export async function getTrendingListings(limit: number = 5) {
  const response = await axios.get(
    `${API_URL}/analytics/listings/trending?limit=${limit}`,
    { withCredentials: true }
  );
  return response.data;
}
