'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { MessagingService, ConversationResponse, MessageResponse } from '@/services/messaging';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
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
  const { t, i18n } = useTranslation('messages');
  const searchParams = useSearchParams();
  const isRTL = i18n.language === 'ar';

  // State declarations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [showUnsupportedFileModal, setShowUnsupportedFileModal] = useState(false);
  const [unsupportedFileName, setUnsupportedFileName] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('🔍 Messages state updated:', messages.length, messages);
  }, [messages]);

  // File validation utility
  const validateFileType = (file: File, type: 'image' | 'document'): { isValid: boolean; error?: string } => {
    if (type === 'image') {
      if (!file.type.startsWith('image/')) {
        return { isValid: false, error: 'not an image file' };
      }
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedImageTypes.includes(file.type)) {
        return { isValid: false, error: 'unsupported image format' };
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { isValid: false, error: 'file too large (max 10MB for images)' };
      }
    } else if (type === 'document') {
      if (file.type.startsWith('image/')) {
        return { isValid: false, error: 'image file (use image button instead)' };
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
        return { isValid: false, error: 'unsupported file type' };
      }
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        return { isValid: false, error: 'file too large (max 25MB for documents)' };
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
    let firstInvalidFile: string | null = null;

    files.forEach((file) => {
      const validation = validateFileType(file, 'image');
      if (validation.isValid) {
        validFiles.push(file);
      } else if (!firstInvalidFile) {
        firstInvalidFile = file.name;
      }
    });

    // Update state with valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      console.log(`✅ Added ${validFiles.length} image(s) successfully`);
    }

    // Show modal for first invalid file
    if (firstInvalidFile) {
      setUnsupportedFileName(firstInvalidFile);
      setShowUnsupportedFileModal(true);
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
    let firstInvalidFile: string | null = null;

    files.forEach((file) => {
      const validation = validateFileType(file, 'document');
      if (validation.isValid) {
        validFiles.push(file);
      } else if (!firstInvalidFile) {
        firstInvalidFile = file.name;
      }
    });

    // Update state with valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      console.log(`✅ Added ${validFiles.length} document(s) successfully`);
    }

    // Show modal for first invalid file
    if (firstInvalidFile) {
      setUnsupportedFileName(firstInvalidFile);
      setShowUnsupportedFileModal(true);
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

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.listingTitle.toLowerCase().includes(searchLower) ||
      conv.listingBrand.toLowerCase().includes(searchLower) ||
      conv.listingModel.toLowerCase().includes(searchLower) ||
      conv.buyer.username.toLowerCase().includes(searchLower) ||
      conv.seller.username.toLowerCase().includes(searchLower)
    );
  });

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
      
      // Update messages to show as read
      setMessages(prev => 
        prev.map(msg => ({ ...msg, isRead: true, readAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, []);

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
        formData.append('content', newMessage.trim() || '');
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
        
        console.log('📨 Adding new message to state:', messageResponse);
        console.log('📨 Current messages before:', messages.length);
      } else {
        // Send text-only message
        messageResponse = await MessagingService.sendMessage(selectedConversation.id, {
          content: newMessage.trim(),
          messageType: 'text'
        });
      }

      // Add the new message to the list
      setMessages(prev => {
        const newMessages = [...prev, messageResponse];
        console.log('📨 New messages after:', newMessages.length);
        return newMessages;
      });

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
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                           (error as { message?: string })?.message || 
                           'An error occurred while sending the message';
      alert(`Failed to send message: ${errorMessage}`);
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
      // TODO: Implement block user API call
      console.log('Blocking user for conversation:', selectedConversation.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowBlockModal(false);
      alert('User has been blocked successfully.');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmReportUser = async () => {
    if (!selectedConversation) return;
    
    try {
      setIsActionLoading(true);
      // TODO: Implement report user API call
      console.log('Reporting user for conversation:', selectedConversation.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowReportModal(false);
      alert('User has been reported successfully.');
    } catch (error) {
      console.error('Error reporting user:', error);
      alert('Failed to report user. Please try again.');
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header with search - scrollable if needed */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('messages')}
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchConversations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Conversations List - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onConversationSelect={setSelectedConversation}
            loading={loading}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-h-0">
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

      {/* Unsupported File Modal */}
      <DeleteConfirmationModal
        isOpen={showUnsupportedFileModal}
        onClose={() => setShowUnsupportedFileModal(false)}
        onConfirm={() => setShowUnsupportedFileModal(false)}
        title={t('unsupportedFileType', 'Unsupported File Type')}
        message={t('unsupportedFileMessage', 'This file type is not supported. Please select an image (JPEG, PNG, WebP, GIF) or document (PDF, Word, Excel, TXT) file.')}
        itemName={unsupportedFileName}
        confirmText={t('common:ok', 'OK')}
        cancelText=""
        type="warning"
      />
    </div>
  );
}
