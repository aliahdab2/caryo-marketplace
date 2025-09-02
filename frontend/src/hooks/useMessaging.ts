import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MessagingService, ConversationResponse, MessageResponse } from '@/services/messaging';

/**
 * Custom hook for messaging functionality with optimized state management
 * Implements best practices for React hooks and state management
 */
export const useMessaging = () => {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup and optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  /**
   * Load conversations with error handling and cleanup
   */
  const loadConversations = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const conversationList = await MessagingService.getUserConversations();
      setConversations(conversationList.content);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to load conversations');
        console.error('Error loading conversations:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Load messages for selected conversation
   */
  const loadMessages = useCallback(async (conversationId: number) => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const messageList = await MessagingService.getConversationMessages(conversationId);
      setMessages(messageList.content);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);
  
  /**
   * Send message with optimistic updates
   */
  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!selectedConversation || (!content.trim() && !files?.length)) return;
    
    setSending(true);
    setError(null);
    
    // Optimistic update
    const optimisticMessage: MessageResponse = {
      id: Date.now(), // Temporary ID
      conversationId: selectedConversation.id,
      content: content || '',
      displayContent: content || '',
      messageType: 'TEXT',
      isRead: false,
      readAt: undefined,
      createdAt: new Date().toISOString(),
      isEdited: false,
      editedAt: undefined,
      isDeleted: false,
      version: 1,
      canBeEdited: true,
      canBeDeleted: true,
      sender: {
        id: Number(session?.user?.id),
        username: session?.user?.name || '',
        email: session?.user?.email || ''
      },
      attachments: files ? files.map((file, index) => ({
        id: Date.now() + index,
        messageId: Date.now(),
        fileName: file.name,
        fileKey: '',
        fileUrl: URL.createObjectURL(file),
        contentType: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        humanReadableSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        image: file.type.startsWith('image/'),
        document: !file.type.startsWith('image/'),
        video: file.type.startsWith('video/'),
        audio: file.type.startsWith('audio/'),
        fileExtension: file.name.split('.').pop() || '',
        validFileType: true,
        uploadStatus: 'PENDING' as const
      })) : []
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      let response: MessageResponse;
      
      if (files?.length) {
        const formData = new FormData();
        formData.append('content', content || '');
        formData.append('messageType', 'TEXT');
        files.forEach(file => formData.append('files', file));
        
        response = await MessagingService.sendMessageWithAttachments(selectedConversation.id, formData);
      } else {
        response = await MessagingService.sendMessage(selectedConversation.id, {
          content,
          messageType: 'TEXT'
        });
      }
      
      // Replace optimistic message with real response
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id ? response : msg
      ));
      
      // Update conversation list
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessageAt: response.createdAt }
          : conv
      ));
      
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      setError('Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  }, [selectedConversation, session?.user]);
  
  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async (messageId: number) => {
    try {
      await MessagingService.markMessageAsRead(messageId);
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, []);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  /**
   * Load conversations on mount
   */
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  
  /**
   * Load messages when conversation changes
   */
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);
  
  return {
    // State
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    error,
    
    // Actions
    setSelectedConversation,
    sendMessage,
    markAsRead,
    loadConversations,
    loadMessages,
    
    // Refs
    messagesEndRef,
    
    // Utilities
    clearError: () => setError(null)
  };
};
