'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { useSearchParams } from 'next/navigation';
import { MessagingService, ConversationResponse, MessageResponse } from '@/services/messaging';
import { sanitizeInput } from '@/utils/sanitization';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import Toast from '@/components/ui/Toast';
import { MessageCircle } from 'lucide-react';
import { transformMinioUrl } from '@/utils/mediaUtils';
import ConversationList from './ConversationList';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

// Using types from messaging service
type Conversation = ConversationResponse;
type Message = MessageResponse;

export default function MessagesPage() {
  const { data: session } = useSession();
  const { t } = useTranslation('messages');
  const { isRTL } = useLanguageSwitching();
  const searchParams = useSearchParams();

  // State declarations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');


  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // File attachment states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [_uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});

  // Typing indicator state (for other person typing)
  const [otherPersonTyping, _setOtherPersonTyping] = useState(false);

  // Modal states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info');


  // Helper function to show toast messages
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // Helper function to extract error message from backend response
  const extractErrorMessage = useCallback((error: unknown): string => {
    // Try to get translated error message from backend
    const apiError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };

    if (apiError?.response?.data?.message) {
      return apiError.response.data.message;
    }
    if (apiError?.response?.data?.error) {
      return apiError.response.data.error;
    }
    if (apiError?.message) {
      return apiError.message;
    }
    // Fallback to generic error message
    return t('errors.uploadFailed', 'Upload failed. Please try again.');
  }, [t]);

  // File validation utility
  const validateFileType = (file: File, type: 'image' | 'document'): { isValid: boolean; error?: string } => {
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return { isValid: false, error: t('errors.notImageFile', 'File is not an image') };
      }
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        return { isValid: false, error: t('errors.unsupportedImageFormat', 'Unsupported image format. Please use JPEG, PNG, WebP, or GIF.') };
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { isValid: false, error: t('errors.imageTooLarge', 'Image file is too large. Maximum size is 10MB.') };
      }
    } else if (type === 'document') {
      if (file.type.startsWith('image/')) {
        return { isValid: false, error: t('errors.useImageButton', 'This is an image file. Please use the image button instead.') };
      }
      const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/rtf'
      ];
      if (!allowedDocTypes.includes(file.type)) {
        return { isValid: false, error: t('errors.unsupportedDocumentType', 'Unsupported document type. Please use PDF, Word, Excel, or text files.') };
      }
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        return { isValid: false, error: t('errors.documentTooLarge', 'Document file is too large. Maximum size is 25MB.') };
      }
    }
    return { isValid: true };
  };

  // File handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate image files
    const validFiles: File[] = [];
    let firstError: string | null = null;

    files.forEach((file) => {
      const validation = validateFileType(file, 'image');
      if (validation.isValid) {
        validFiles.push(file);
      } else if (!firstError && validation.error) {
        firstError = validation.error;
      }
    });

    // Update state with valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Show error toast for first invalid file
    if (firstError) {
      showToast(firstError, 'error');
    }

    // Clear the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate document files
    const validFiles: File[] = [];
    let firstError: string | null = null;

    files.forEach((file) => {
      const validation = validateFileType(file, 'document');
      if (validation.isValid) {
        validFiles.push(file);
      } else if (!firstError && validation.error) {
        firstError = validation.error;
      }
    });

    // Update state with valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Show error toast for first invalid file
    if (firstError) {
      showToast(firstError, 'error');
    }

    // Clear the input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    // Clear any errors for this file
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`file-${index}`];
      return newErrors;
    });
  };

  // Download function for document attachments
  const downloadDocument = async (fileKey: string, fileName: string) => {
    try {
      // Transform the MinIO URL for download
      const downloadUrl = transformMinioUrl(fileKey);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  // Keyboard shortcuts and typing detection
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageWithAttachments();
    }
  };

  // Authentication check
  useEffect(() => {
    if (!session) {
      signIn();
      return;
    }
  }, [session]);

  // Load conversations on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations();
    }
  }, [session?.user?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await MessagingService.getUserConversations();
      setConversations(response.content || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };



  const markConversationAsRead = useCallback(async (conversationId: number) => {
    try {
      await MessagingService.markAllMessagesAsRead(conversationId);

      // Update the conversation's unread count in the local state
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      // Update messages to show as read - ONLY for messages NOT sent by current user
      const currentUserId = session?.user?.id ? Number(session.user.id) : 0;
      setMessages(prev =>
        prev.map(msg =>
          msg.sender.id !== currentUserId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg // Keep user's own messages unchanged
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [session?.user?.id]);

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await MessagingService.getConversationMessages(conversationId);
      setMessages(response.content || []);

      // Mark all messages in this conversation as read
      await markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [markConversationAsRead]);

  // Handle conversation selection from URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id.toString() === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [searchParams, conversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && session?.user?.id) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, session?.user?.id, loadMessages]);

  const handleSendMessageWithAttachments = async () => {
    if (!selectedConversation || (!newMessage.trim() && selectedFiles.length === 0) || sending || uploading) return;

    setSending(true);
    setUploading(true);

    try {
      let messageResponse: MessageResponse;

      if (selectedFiles.length > 0) {
        // Send message with attachments
        const formData = new FormData();
        const sanitizedContent = newMessage.trim() ? sanitizeInput(newMessage.trim()) : '';
        formData.append('content', sanitizedContent);
        formData.append('messageType', 'text');

        // Normalize/ensure allowed MIME types for documents
        const inferMimeType = (name: string, fallback: string): string => {
          const ext = (name || '').toLowerCase().split('.').pop() || '';
          switch (ext) {
            case 'pdf': return 'application/pdf';
            case 'doc': return 'application/msword';
            case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            case 'xls': return 'application/vnd.ms-excel';
            case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case 'rtf': return 'application/rtf';
            case 'txt': return 'text/plain';
            case 'jpg':
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            case 'webp': return 'image/webp';
            case 'gif': return 'image/gif';
            default: return fallback || 'application/octet-stream';
          }
        };

        selectedFiles.forEach((file, idx) => {
          const name = file.name || `attachment_${idx + 1}`;
          const type = (!file.type || file.type === 'application/octet-stream')
            ? inferMimeType(name, file.type)
            : file.type;
          const normalized = new File([file], name, { type });
          formData.append('files', normalized);
        });

        messageResponse = await MessagingService.sendMessageWithAttachments(selectedConversation.id, formData);
      } else {
        // Send text-only message
        const sanitizedContent = sanitizeInput(newMessage.trim());
        messageResponse = await MessagingService.sendMessage(selectedConversation.id, {
          content: sanitizedContent,
          messageType: 'text'
        });
      }

      // Add the new message to the list
      setMessages(prev => [...prev, messageResponse]);

      // Clear the input and files
      setNewMessage('');
      setSelectedFiles([]);
      setUploadErrors({});

      // Update conversation list to reflect new message
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessageAt: messageResponse.createdAt,
              recentMessages: [{
                id: messageResponse.id,
                content: messageResponse.content,
                messageType: messageResponse.messageType,
                isRead: messageResponse.isRead,
                readAt: messageResponse.readAt,
                createdAt: messageResponse.createdAt,
                isEdited: false,
                editedAt: undefined,
                isDeleted: false,
                sender: messageResponse.sender,
                attachments: messageResponse.attachments?.map(att => ({
                  id: att.id,
                  fileName: att.fileName,
                  size: att.size,
                  contentType: att.contentType,
                  fileUrl: att.fileUrl,
                  uploadStatus: 'COMPLETED',
                  createdAt: messageResponse.createdAt
                }))
              }]
            }
          : conv
      ));

    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // Modal handlers
  const confirmBlockUser = async () => {
    if (!selectedConversation) return;

    try {
      setIsActionLoading(true);
      await MessagingService.blockUser(selectedConversation.id);

      // Update conversation status to blocked
      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, isBlocked: true, status: 'BLOCKED' }
          : conv
      ));

      setSelectedConversation(prev => prev ? { ...prev, isBlocked: true, status: 'BLOCKED' } : null);
      setShowBlockModal(false);
      showToast(t('userBlockedSuccess', 'User has been blocked successfully.'), 'success');
    } catch (error) {
      console.error('Error blocking user:', error);
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmReportUser = async () => {
    if (!selectedConversation || !session?.user?.id) return;

    try {
      setIsActionLoading(true);
      
      // Get the other participant (reported user)
      const currentUserId = Number(session.user.id);
      const reportedUserId = selectedConversation.buyer.id === currentUserId
        ? selectedConversation.seller.id
        : selectedConversation.buyer.id;

      await MessagingService.reportUser({
        reportedUserId: reportedUserId,
        conversationId: selectedConversation.id,
        reportType: 'OTHER', // Default type - can be enhanced with a proper modal later
        reason: t('defaultReportReason', 'User reported through messaging interface')
      });

      setShowReportModal(false);
      showToast(t('userReportedSuccess', 'User has been reported successfully. Our team will review the report.'), 'success');
    } catch (error) {
      console.error('Error reporting user:', error);
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      setIsActionLoading(true);
      // Archive conversation instead of delete (safer approach)
      await MessagingService.archiveConversation(selectedConversation.id);

      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      setSelectedConversation(null);
      setMessages([]);
      setShowDeleteModal(false);

      alert('Conversation archived successfully.');
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Failed to archive conversation. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!session) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="h-[calc(100vh-9rem)] md:h-[calc(100vh-10rem)] bg-gray-50 dark:bg-gray-900 flex overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
        </div>

        {/* Conversations List */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={setSelectedConversation}
            loading={loading}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MessageList
              selectedConversation={selectedConversation}
              messages={messages}
              currentUserId={session.user.id ? Number(session.user.id) : 0}
              isRTL={isRTL}
              otherPersonTyping={otherPersonTyping}
              onDownloadDocument={downloadDocument}
            />
          </div>

          <div className="flex-shrink-0">
            <MessageInput
              newMessage={newMessage}
              selectedFiles={selectedFiles}
              sending={sending}
              uploading={uploading}
              isRTL={isRTL}
              onMessageChange={setNewMessage}
              onKeyPress={handleKeyPress}
              onSendMessage={handleSendMessageWithAttachments}
              onImageSelect={handleImageSelect}
              onDocumentSelect={handleDocumentSelect}
              onRemoveFile={removeFile}
              onClearAllFiles={() => setSelectedFiles([])}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('selectConversation')}</h3>
            <p className="text-sm">{t('selectConversationDesc')}</p>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Confirmation Modals */}
      <DeleteConfirmationModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={confirmBlockUser}
        title={t('blockUser')}
        message={t('blockUserConfirmation')}
        confirmText={t('block')}
        cancelText={t('cancel')}
        type="danger"
        isLoading={isActionLoading}
        loadingText={t('common:blocking', 'Blocking...')}
      />

      <DeleteConfirmationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={confirmReportUser}
        title={t('reportUser')}
        message={t('reportUserConfirmation')}
        confirmText={t('report')}
        cancelText={t('cancel')}
        type="warning"
        isLoading={isActionLoading}
        loadingText={t('common:reporting', 'Reporting...')}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteConversation}
        title={t('deleteConversation')}
        message={t('deleteConversationConfirmation')}
        itemName={selectedConversation ? (
          `${selectedConversation.listingBrand} ${selectedConversation.listingModel} ${selectedConversation.listingYear}`
        ) : undefined}
        isLoading={isActionLoading}
        loadingText={t('common:deleting', 'Deleting...')}
        confirmText={t('deleteConversation')}
        cancelText={t('cancel')}
        type="danger"
      />

      {/* Toast Notification */}
      <Toast
        type={toastType}
        message={toastMessage}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
        autoHideDuration={5000}
        dismissible={true}
      />
    </div>
  );
}
