/**
 * React Query hooks for messaging operations
 * 
 * These hooks provide caching and loading/error states
 * for all messaging-related operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessagingService, SendMessageRequest } from '@/services/messaging';

// Query key factory for consistent cache key management
export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: () => [...messagingKeys.all, 'conversations'] as const,
  conversationList: (params?: { page?: number; size?: number }) => 
    [...messagingKeys.conversations(), 'list', params] as const,
  conversation: (id: number) => [...messagingKeys.conversations(), id] as const,
  messages: (conversationId: number) => [...messagingKeys.all, 'messages', conversationId] as const,
  messageList: (conversationId: number, params?: { page?: number; size?: number }) =>
    [...messagingKeys.messages(conversationId), 'list', params] as const,
  stats: () => [...messagingKeys.all, 'stats'] as const,
  unreadCount: () => [...messagingKeys.all, 'unreadCount'] as const,
};

/**
 * Hook to fetch user's conversations with pagination
 * 
 * @param options - Additional options including pagination
 * 
 * @example
 * const { data, isLoading } = useConversations();
 * const conversations = data?.content || [];
 */
export function useConversations(options?: {
  page?: number;
  size?: number;
  enabled?: boolean;
}) {
  const { page = 0, size = 20, enabled = true } = options || {};

  return useQuery({
    queryKey: messagingKeys.conversationList({ page, size }),
    queryFn: () => MessagingService.getUserConversations(page, size),
    staleTime: 1 * 60 * 1000, // 1 minute - conversations change frequently
    gcTime: 5 * 60 * 1000,
    enabled,
  });
}

/**
 * Hook to fetch a specific conversation by ID
 * 
 * @param id - The conversation ID
 * @param options - Additional React Query options
 * 
 * @example
 * const { data: conversation, isLoading } = useConversation(123);
 */
export function useConversation(id: number | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: messagingKeys.conversation(id!),
    queryFn: () => MessagingService.getConversation(id!),
    enabled: !!id && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch messages in a conversation with pagination
 * 
 * @param conversationId - The conversation ID
 * @param options - Pagination and query options
 * 
 * @example
 * const { data, isLoading } = useMessages(123);
 * const messages = data?.content || [];
 */
export function useMessages(
  conversationId: number | undefined,
  options?: { page?: number; size?: number; enabled?: boolean }
) {
  const { page = 0, size = 50, enabled = true } = options || {};

  return useQuery({
    queryKey: messagingKeys.messageList(conversationId!, { page, size }),
    queryFn: () => MessagingService.getConversationMessages(conversationId!, page, size),
    enabled: !!conversationId && enabled,
    staleTime: 30 * 1000, // 30 seconds - messages change frequently
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch conversation statistics
 * 
 * @example
 * const { data: stats } = useConversationStats();
 */
export function useConversationStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: messagingKeys.stats(),
    queryFn: MessagingService.getConversationStats,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch unread message count
 * 
 * @example
 * const { data } = useUnreadMessageCount();
 * const count = data?.count || 0;
 */
export function useUnreadMessageCount(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: messagingKeys.unreadCount(),
    queryFn: MessagingService.getUnreadMessageCount,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval || 60 * 1000, // Poll every minute
    ...options,
  });
}

/**
 * Mutation hook to send a message
 * 
 * @example
 * const sendMutation = useSendMessage();
 * await sendMutation.mutateAsync({ conversationId: 123, request: { content: 'Hello' } });
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, request }: { conversationId: number; request: SendMessageRequest }) =>
      MessagingService.sendMessage(conversationId, request),
    onSuccess: (_data, { conversationId }) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      // Invalidate conversation to update lastMessageAt
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(conversationId) });
      // Invalidate conversation list to update order
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

/**
 * Mutation hook to create a new conversation
 * 
 * @example
 * const createMutation = useCreateConversation();
 * const conversation = await createMutation.mutateAsync({ listingId: 456, initialMessage: 'Hi!' });
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: MessagingService.createConversation,
    onSuccess: () => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
}

/**
 * Mutation hook to mark messages as read
 * 
 * @example
 * const markReadMutation = useMarkAllMessagesAsRead();
 * await markReadMutation.mutateAsync(123);
 */
export function useMarkAllMessagesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) => MessagingService.markAllMessagesAsRead(conversationId),
    onSuccess: (_data, conversationId) => {
      // Update unread count
      queryClient.invalidateQueries({ queryKey: messagingKeys.unreadCount() });
      // Update conversation
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

/**
 * Mutation hook to edit a message
 * 
 * @example
 * const editMutation = useEditMessage();
 * await editMutation.mutateAsync({ messageId: 789, content: 'Updated message' });
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: number; content: string }) =>
      MessagingService.editMessage(messageId, content),
    onSuccess: () => {
      // Invalidate all messages - we don't know which conversation
      queryClient.invalidateQueries({ queryKey: messagingKeys.all });
    },
  });
}

/**
 * Mutation hook to delete a message
 * 
 * @example
 * const deleteMutation = useDeleteMessage();
 * await deleteMutation.mutateAsync(789);
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => MessagingService.deleteMessage(messageId),
    onSuccess: () => {
      // Invalidate all messages
      queryClient.invalidateQueries({ queryKey: messagingKeys.all });
    },
  });
}

/**
 * Mutation hook to archive a conversation
 * 
 * @example
 * const archiveMutation = useArchiveConversation();
 * await archiveMutation.mutateAsync(123);
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) => MessagingService.archiveConversation(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.stats() });
    },
  });
}

/**
 * Mutation hook to block a user in a conversation
 * 
 * @example
 * const blockMutation = useBlockUser();
 * await blockMutation.mutateAsync(123);
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) => MessagingService.blockUser(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}
