/**
 * React Query hooks index
 * 
 * Central export for all React Query hooks.
 * Import from '@/hooks/queries' for convenient access.
 * 
 * @example
 * import { useListings, useFavorites, useConversations } from '@/hooks/queries';
 */

// Listing hooks
export {
  useListings,
  useListing,
  useMyListings,
  useFeaturedListings,
  useCreateListing,
  useUpdateListing,
  useDeleteListing,
  useDeleteMultipleListings,
  listingKeys,
} from './useListings';

// Favorites hooks
export {
  useFavorites,
  useFavoriteStatus,
  useAddToFavorites,
  useRemoveFromFavorites,
  useToggleFavorite,
  favoriteKeys,
} from './useFavorites';

// Saved searches hooks
export {
  useSavedSearches,
  useSavedSearch,
  useSavedSearchResults,
  useCreateSavedSearch,
  useUpdateSavedSearch,
  useDeleteSavedSearch,
  savedSearchKeys,
} from './useSavedSearches';

// Dealer hooks
export {
  useDealerTrialStatus,
  useCanCreateListing,
  useDealerProfile,
  usePaymentHistory,
  usePaymentStatus,
  useCreateSubscription,
  dealerKeys,
} from './useDealer';

// Messaging hooks
export {
  useConversations,
  useConversation,
  useMessages,
  useConversationStats,
  useUnreadMessageCount,
  useSendMessage,
  useCreateConversation,
  useMarkAllMessagesAsRead,
  useEditMessage,
  useDeleteMessage,
  useArchiveConversation,
  useBlockUser,
  messagingKeys,
} from './useMessaging';
