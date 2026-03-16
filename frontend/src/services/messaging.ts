import { api } from './api';

// API Response wrapper interface
interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateConversationRequest {
  listingId: number;
  initialMessage: string;
  subject?: string;
  messageType?: string;
  attachmentIds?: number[];
}

export interface SendMessageRequest {
  content: string;
  messageType?: string;
  replyToMessageId?: number;
  attachmentIds?: number[];
  clientMessageId?: string;
}

export interface ConversationResponse {
  id: number;
  listingId: number;
  listingTitle: string;
  listingImageUrl?: string;
  listingPrice: string;
  listingCurrency: string;
  listingBrand: string;
  listingModel: string;
  listingYear: number;
  buyer: UserSummary;
  seller: UserSummary;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  recentMessages?: MessageSummary[];
  participants?: ParticipantSummary[];
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  content: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  version: number;
  sender: UserSummary;
  attachments?: MessageAttachmentResponse[];
  canBeEdited: boolean;
  canBeDeleted: boolean;
  displayContent: string;
  statusDescription?: string;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  profileImageUrl?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface MessageSummary {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  sender: UserSummary;
  attachments?: AttachmentSummary[];
}

export interface AttachmentSummary {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
  fileUrl: string;
  uploadStatus: string;
  createdAt: string;
}

export interface MessageAttachmentResponse {
  id: number;
  fileName: string;
  contentType: string;
  size: number;
  fileUrl: string;
  uploadStatus: string;
  errorMessage?: string;
  createdAt: string;
  isDeleted: boolean;
  humanReadableSize: string;
  image: boolean;
  document: boolean;
  video: boolean;
  audio: boolean;
  fileExtension: string;
  validFileType: boolean;
}

export interface ParticipantSummary {
  id: number;
  user: UserSummary;
  role: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  isMuted: boolean;
  mutedUntil?: string;
  lastReadMessageId?: number;
  lastReadAt?: string;
  unreadCount: number;
  statusDescription?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    pageSize: number;
    pageNumber: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Messaging API service for handling conversations and messages
 */
export class MessagingService {
  
  /**
   * Create a new conversation
   */
  static async createConversation(request: CreateConversationRequest): Promise<ConversationResponse> {
    const response = await api.post<ApiResponse<ConversationResponse>>('/api/v1/conversations', request as unknown as Record<string, unknown>);
    return response.data;
  }

  /**
   * Get user's conversations with pagination
   */
  static async getUserConversations(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'lastMessageAt',
    sortDir: string = 'desc'
  ): Promise<PaginatedResponse<ConversationResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });
    const response = await api.get<PaginatedResponse<ConversationResponse>>(`/api/v1/conversations/my-conversations?${params}`);
    return response;
  }

  /**
   * Get a specific conversation by ID
   */
  static async getConversation(id: number): Promise<ConversationResponse> {
    const response = await api.get<ConversationResponse>(`/api/v1/conversations/${id}`);
    return response;
  }

  /**
   * Get messages in a conversation with pagination
   */
  static async getConversationMessages(
    conversationId: number,
    page: number = 0,
    size: number = 50,
    sortBy: string = 'createdAt',
    sortDir: string = 'asc'
  ): Promise<PaginatedResponse<MessageResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    });
    const response = await api.get<PaginatedResponse<MessageResponse>>(`/api/v1/conversations/${conversationId}/messages?${params}`);
    return response;
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(conversationId: number, request: SendMessageRequest): Promise<MessageResponse> {
    const response = await api.post<{data: MessageResponse}>(`/api/v1/conversations/${conversationId}/messages`, request as unknown as Record<string, unknown>);
    return response.data;
  }

  /**
   * Mark a message as read
   */
  static async markMessageAsRead(messageId: number): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/api/v1/conversations/messages/${messageId}/read`);
    return response;
  }

  /**
   * Mark all messages in a conversation as read
   */
  static async markAllMessagesAsRead(conversationId: number): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/api/v1/conversations/${conversationId}/messages/read-all`);
    return response;
  }

  /**
   * Archive a conversation
   */
  static async archiveConversation(conversationId: number): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(`/api/v1/conversations/${conversationId}/archive`);
    return response;
  }

  /**
   * Update conversation status
   */
  static async updateConversationStatus(
    conversationId: number, 
    status: string
  ): Promise<{ message: string }> {
    const params = new URLSearchParams({ status });
    const response = await api.patch<{ message: string }>(`/api/v1/conversations/${conversationId}/status?${params}`);
    return response;
  }

  /**
   * Edit a message (within 5 minutes of creation)
   */
  static async editMessage(messageId: number, content: string): Promise<MessageResponse> {
    const response = await api.put<MessageResponse>(`/api/v1/messages/${messageId}`, { content } as unknown as Record<string, unknown>);
    return response;
  }

  /**
   * Delete a message (within 1 hour of creation)
   */
  static async deleteMessage(messageId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/v1/messages/${messageId}`);
    return response;
  }

  /**
   * Mute/unmute a conversation participant
   */
  static async muteParticipant(
    conversationId: number, 
    participantId: number, 
    muted: boolean,
    mutedUntil?: string
  ): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>(
      `/api/v1/conversations/${conversationId}/participants/${participantId}/mute`,
      { muted, mutedUntil } as unknown as Record<string, unknown>
    );
    return response;
  }

  /**
   * Upload message attachment
   */
  static async uploadMessageAttachment(
    conversationId: number,
    file: File
  ): Promise<{ id: number; fileName: string; fileUrl: string; contentType: string; size: number; isImage: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ id: number; fileName: string; fileUrl: string; contentType: string; size: number; isImage: boolean }>>(`/api/v1/conversations/${conversationId}/messages/attachments`, formData);
    return response.data;
  }

  /**
   * Send message with attachments
   */
  static async sendMessageWithAttachments(
    conversationId: number, 
    formData: FormData
  ): Promise<MessageResponse> {
    const response = await api.post<{data: MessageResponse}>(`/api/v1/conversations/${conversationId}/messages/with-attachments`, formData);
    return response.data;
  }

  /**
   * Get conversation statistics for a user
   */
  static async getConversationStats(): Promise<{
    totalConversations: number;
    activeConversations: number;
    unreadMessages: number;
    archivedConversations: number;
  }> {
    const response = await api.get<{
      totalConversations: number;
      activeConversations: number;
      unreadMessages: number;
      archivedConversations: number;
    }>('/api/v1/conversations/stats');
    return response;
  }

  /**
   * Search conversations
   */
  static async searchConversations(
    query: string,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedResponse<ConversationResponse>> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString()
    });
    const response = await api.get<PaginatedResponse<ConversationResponse>>(`/api/v1/conversations/search?${params}`);
    return response;
  }

  /**
   * Get unread message count for all conversations
   */
  static async getUnreadMessageCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/api/v1/conversations/unread-count');
    return response;
  }

  /**
   * Block a user in a conversation
   */
  static async blockUser(conversationId: number): Promise<{ message: string }> {
    const response = await api.patch<{ data?: unknown; message: string }>(`/api/v1/conversations/${conversationId}/block`);
    return { message: response.message || 'User has been blocked successfully' };
  }

  /**
   * Report a user
   */
  static async reportUser(request: {
    reportedUserId: number;
    conversationId?: number;
    reportType: string;
    reason: string;
  }): Promise<{ id: number; message: string }> {
    const response = await api.post<{ data?: { id: number }; message: string }>('/api/v1/reports', request as unknown as Record<string, unknown>);
    return {
      id: response.data?.id || 0,
      message: response.message || 'User has been reported successfully'
    };
  }
}

// Utility functions for messaging
export const MessagingUtils = {
  /**
   * Format time ago for messages
   */
  formatTimeAgo: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  },

  /**
   * Format file size in human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Check if message can be edited (within 5 minutes)
   */
  canEditMessage: (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    return diffInMinutes <= 5;
  },

  /**
   * Check if message can be deleted (within 1 hour)
   */
  canDeleteMessage: (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    return diffInMinutes <= 60;
  },

  /**
   * Get file type from content type
   */
  getFileType: (contentType: string): 'image' | 'document' | 'video' | 'audio' | 'other' => {
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    if (contentType.startsWith('audio/')) return 'audio';
    if (contentType.includes('pdf') || contentType.includes('document') || contentType.includes('text')) {
      return 'document';
    }
    return 'other';
  },

  /**
   * Validate message content
   */
  validateMessageContent: (content: string): { isValid: boolean; error?: string } => {
    if (!content || content.trim().length === 0) {
      return { isValid: false, error: 'Message cannot be empty' };
    }
    if (content.length > 1000) {
      return { isValid: false, error: 'Message cannot exceed 1000 characters' };
    }
    return { isValid: true };
  },
};

export default MessagingService;
