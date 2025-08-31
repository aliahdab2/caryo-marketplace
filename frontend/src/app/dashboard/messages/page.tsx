'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { MessagingService, ConversationResponse, MessageResponse } from '@/services/messaging';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import {
  Send, 
  Paperclip,
  MoreHorizontal,
  Check,
  CheckCheck,
  MessageCircle,
  X,
  ArrowLeft
} from 'lucide-react';
import { validateMessagingImages } from '@/utils/imageValidation';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import Image from 'next/image';

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

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // File attachment states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<{[key: string]: string}>({});
  
  // Typing indicator state (for other person typing)
  const [otherPersonTyping, setOtherPersonTyping] = useState(false);
  
  // Modal states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refs for UX improvements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts and typing detection
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim() || selectedFiles.length > 0) {
        handleSendMessageWithAttachments();
      }
    }
    if (e.key === 'Escape') {
      setSelectedFiles([]);
    }
  };

  // TODO: Implement real-time typing indicators with WebSocket/Server-Sent Events
  // For now, we'll remove the self-typing indicator as it's confusing UX
  // The typing indicator should only show when the OTHER person is typing
  
  // Real typing indicator would work like this:
  // 1. When user types, send "typing_start" event to server
  // 2. Server broadcasts to other participants in conversation
  // 3. Show typing indicator for other person
  // 4. Send "typing_stop" after user stops typing for 2-3 seconds
  // 5. Auto-hide typing indicator after timeout

  // Action loading state
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Load conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await MessagingService.getUserConversations(0, 20, 'lastMessageAt', 'desc');
        // conversations loaded
        setConversations(response.content);
      } catch (error) {
        console.error('Error loading conversations:', error);
        // For now, show empty state on error
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [session]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === parseInt(conversationId));
      if (conversation) {
        handleConversationSelect(conversation);
      }
    }
  }, [conversations, searchParams]);

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // On mobile, hide sidebar when conversation is selected
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
    
    try {
      // Load messages for the selected conversation
      const response = await MessagingService.getConversationMessages(conversation.id, 0, 50, 'createdAt', 'asc');
      setMessages(response.content);
      
      // Mark all messages as read
      if (conversation.unreadCount > 0) {
        await MessagingService.markAllMessagesAsRead(conversation.id);
        // Update the conversation's unread count in the list
        setConversations(prev => prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  // Removed unused handleSendMessage - now using handleSendMessageWithAttachments for all messages

  const handleBlockUser = () => {
    if (!selectedConversation) return;
    setShowDropdown(false);
    setShowBlockModal(true);
  };

  const handleReportUser = () => {
    if (!selectedConversation) return;
    setShowDropdown(false);
    setShowReportModal(true);
  };

  const handleDeleteConversation = () => {
    if (!selectedConversation) return;
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const confirmBlockUser = async () => {
    if (!selectedConversation) return;
    
    try {
      setIsActionLoading(true);
      // TODO: Implement block user API call
      // blocking user
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowBlockModal(false);
      // Success feedback is already provided by the modal closing
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
      // reporting user
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowReportModal(false);
      // Success feedback is already provided by the modal closing
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
      
      // Archive the conversation (backend doesn't have delete, only archive)
      await MessagingService.archiveConversation(selectedConversation.id);
      
      // Remove from conversations list (archived conversations are filtered out)
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      setSelectedConversation(null);
      setMessages([]);
      
      setShowDeleteModal(false);
      // Success feedback is already provided by the modal closing and conversation disappearing
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // File attachment handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Separate images from other files for different validation
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const documentFiles = files.filter(file => !file.type.startsWith('image/'));

    // Validate images using shared utility
    if (imageFiles.length > 0) {
      const imageValidation = await validateMessagingImages(imageFiles);
      
      imageValidation.results.forEach((result, index) => {
        if (result.isValid) {
          validFiles.push(imageFiles[index]);
        } else {
          errors.push(`${imageFiles[index].name}: ${result.errors.join(', ')}`);
        }
      });
    }

    // Validate document files with basic checks
    const maxDocSize = 10 * 1024 * 1024; // 10MB
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    for (const file of documentFiles) {
      if (!allowedDocTypes.includes(file.type)) {
        errors.push(`${file.name}: File type ${file.type} is not supported. Please select PDFs, Word documents, or text files.`);
        continue;
      }
      if (file.size > maxDocSize) {
        errors.push(`${file.name}: File is too large. Maximum size is 10MB.`);
        continue;
      }
      validFiles.push(file);
    }

    // Show errors if any
    if (errors.length > 0) {
      alert(`Some files could not be added:\n\n${errors.join('\n')}`);
    }

    // Add valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Clear the input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Clean up object URL to prevent memory leaks
      const removedFile = prev[index];
      if (removedFile && removedFile.type.startsWith('image/')) {
        // Create a map to track object URLs
        const objectUrl = URL.createObjectURL(removedFile);
        URL.revokeObjectURL(objectUrl);
      }
      return newFiles;
    });
  };

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
        formData.append('messageType', 'TEXT');
        
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        // Debug: Log FormData contents
        // sending formData

        messageResponse = await MessagingService.sendMessageWithAttachments(selectedConversation.id, formData);
      } else {
        // Send regular text message
        messageResponse = await MessagingService.sendMessage(selectedConversation.id, {
          content: newMessage.trim(),
          messageType: 'TEXT'
        });
      }

      // Add the new message to the list
      setMessages(prev => [...prev, messageResponse]);
      
      // Update the conversation's last message time
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessageAt: messageResponse.createdAt }
          : conv
      ));
      
      // Clear inputs
      setNewMessage('');
      // Clean up object URLs before clearing files
      selectedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
          URL.revokeObjectURL(URL.createObjectURL(file));
        }
      });
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error sending message with attachments:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to send message. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Failed to send message: ${error.message}`;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = `Failed to send message: ${(error as { message: string }).message}`;
      }
      
      alert(errorMessage);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };



  // Check if user is authenticated
  if (!session?.user && !loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('loginRequired')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to sign in to access your messages and conversations.
          </p>
          <button
            onClick={() => signIn()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gray-50 dark:bg-gray-900 flex ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Sidebar - Conversations */}
      <div className={`${showSidebar ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 ${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-800 shadow-sm ${selectedConversation && !showSidebar ? 'absolute inset-0 z-10 lg:relative lg:z-auto' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              {t('title')}
            </h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {conversations.length} {conversations.length === 1 ? t('conversation') : t('conversations')}
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <MessageCircle className="h-6 w-6 opacity-50" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">{t('noConversations')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('startConversation')}</p>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
                {t('browseListings')}
              </button>
            </div>
          ) : (
            <div className="p-1">
              {conversations.map((conversation) => {
                const otherUser = Number(session?.user?.id) === conversation.buyer.id 
                  ? conversation.seller 
                  : conversation.buyer;
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Listing Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={(() => {
                            if (!conversation.listingImageUrl) return getDefaultImageUrl();
                            const url = transformMinioUrl(conversation.listingImageUrl);
                            return url || getDefaultImageUrl();
                          })()}
                          alt={`${conversation.listingBrand} ${conversation.listingModel}`}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                          onError={(e) => { e.currentTarget.src = getDefaultImageUrl(); }}
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                            {conversation.listingBrand} {conversation.listingModel} {conversation.listingYear}
                          </h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center text-[10px] font-bold">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(conversation.lastMessageAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {otherUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {otherUser.username}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className={`text-sm text-gray-600 dark:text-gray-400 truncate flex-1 ${isRTL ? 'ml-2' : 'mr-2'}`}>
                            {conversation.recentMessages?.[0]?.content || 'No messages yet'}
                          </p>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {conversation.listingPrice} {conversation.listingCurrency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className={`flex-1 flex flex-col ${!showSidebar || selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base shadow-sm">
                    {(Number(session?.user?.id) === selectedConversation.buyer.id
                      ? selectedConversation.seller.username
                      : selectedConversation.buyer.username).charAt(0).toUpperCase()}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base">
                      {Number(session?.user?.id) === selectedConversation.buyer.id
                        ? selectedConversation.seller.username
                        : selectedConversation.buyer.username}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {t('chatting_about')} {selectedConversation.listingBrand} {selectedConversation.listingModel}
                    </p>
                  </div>
                </div>
                
                {/* More Options Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title={t('moreOptions')}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                  
                  {showDropdown && (
                    <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 py-1`}>
                      <button
                        onClick={handleBlockUser}
                        className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors`}
                      >
                        <X className="h-4 w-4" />
                        {t('blockUser')}
                      </button>
                      <button
                        onClick={handleReportUser}
                        className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors`}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {t('reportUser')}
                      </button>
                      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                      <button
                        onClick={handleDeleteConversation}
                        className={`w-full px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors`}
                      >
                        <X className="h-4 w-4" />
                        {t('deleteConversation')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Listing Info Section */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Listing Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700 shadow-sm">
                  <Image
                    src={(() => {
                      if (!selectedConversation.listingImageUrl) {
                        return getDefaultImageUrl();
                      }
                      const transformedUrl = transformMinioUrl(selectedConversation.listingImageUrl);
                      return transformedUrl || getDefaultImageUrl();
                    })()}
                    alt={`${selectedConversation.listingBrand} ${selectedConversation.listingModel}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={(e) => {
                      // image error fallback
                      e.currentTarget.src = getDefaultImageUrl();
                    }}
                  />
                </div>
                
                {/* Listing Details */}
                <div className="flex-1 min-w-0">
                                      <button 
                      onClick={() => window.open(`/listings/${selectedConversation.listingId}`, '_blank')}
                      className="w-full text-left hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg p-2 -m-2 transition-all duration-200"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {selectedConversation.listingBrand} {selectedConversation.listingModel} {selectedConversation.listingYear}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          {selectedConversation.listingPrice} {selectedConversation.listingCurrency}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {t('clickToView')}
                        </div>
                      </div>
                    </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">{t('noMessages')}</p>
                    <p className="text-xs mt-1">{t('startTyping')}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const isOwn = Number(session?.user?.id) === message.sender?.id;
                    return (
                      <div
                        key={message.id ? `msg-${message.id}` : `temp-${index}-${Date.now()}`}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-end gap-2 max-w-[75%] ${
                          isOwn 
                            ? (isRTL ? 'flex-row' : 'flex-row-reverse') 
                            : (isRTL ? 'flex-row-reverse' : 'flex-row')
                        }`}>
                          {!isOwn && (
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
                              {(Number(session?.user?.id) === selectedConversation.buyer.id
                                ? selectedConversation.seller.username
                                : selectedConversation.buyer.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`rounded-xl px-3 py-2 ${
                              isOwn
                                ? `bg-gradient-to-r from-blue-600 to-blue-700 text-white ${isRTL ? 'rounded-bl-md' : 'rounded-br-md'}`
                                : `bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 ${isRTL ? 'rounded-br-md' : 'rounded-bl-md'}`
                            }`}
                          >
                            {/* Only show text content if it's not just "Attachment" */}
                            {(message.displayContent && message.displayContent !== 'Attachment') && (
                              <p className="text-sm leading-relaxed">
                                {message.displayContent}
                              </p>
                            )}
                            
                            {/* Message Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2">
                                {message.attachments.map((attachment) => (
                                    <div key={`${message.id}-${attachment.id}`}>
                                      {attachment.image ? (
                                        // Display image as small thumbnail inline
                                        <div className="relative inline-block">
                                          <Image
                                            src={transformMinioUrl(attachment.fileUrl)}
                                            alt={attachment.fileName}
                                            width={120}
                                            height={90}
                                            className="rounded-lg max-w-[120px] max-h-[90px] object-cover cursor-pointer"
                                            onClick={() => window.open(transformMinioUrl(attachment.fileUrl), '_blank')}
                                            unoptimized
                                            onError={(e) => {
                                              console.error('Failed to load image:', attachment.fileUrl);
                                              // Replace with a placeholder instead of hiding
                                              e.currentTarget.src = getDefaultImageUrl();
                                              e.currentTarget.onerror = null; // Prevent infinite loop
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        // Display non-image files as simple attachment
                                        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                          <div className="flex-shrink-0">
                                            {attachment.contentType === 'application/pdf' ? (
                                              <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                                                <span className="text-red-600 dark:text-red-400 text-xs font-medium">PDF</span>
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                                                <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">DOC</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-medium truncate ${isOwn ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                              {attachment.fileName}
                                            </p>
                                            <p className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                              {attachment.humanReadableSize || `${(attachment.size / 1024 / 1024).toFixed(2)} MB`}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => window.open(transformMinioUrl(attachment.fileUrl), '_blank')}
                                            className={`text-xs px-2 py-1 rounded ${isOwn ? 'text-blue-100 hover:bg-blue-500' : 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'} transition-colors`}
                                          >
                                            View
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                ))}
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                {formatTimeAgo(message.createdAt)}
                              </p>
                              {isOwn && (
                                <div className="flex items-center">
                                  {message.isRead ? (
                                    <div title="Read">
                                      <CheckCheck className="h-3 w-3 text-blue-200" />
                                    </div>
                                  ) : (
                                    <div title="Delivered">
                                      <Check className="h-3 w-3 text-blue-300" />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Typing indicator - only show when OTHER person is typing */}
                  {otherPersonTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 max-w-[75%]">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs">
                          {selectedConversation && (
                            (Number(session?.user?.id) === selectedConversation.buyer.id
                              ? selectedConversation.seller.username
                              : selectedConversation.buyer.username).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
              {/* Error Display */}
              {uploadErrors.general && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                      <span className="text-red-600 dark:text-red-400 text-xs">!</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">{uploadErrors.general}</p>
                    <button
                      onClick={() => setUploadErrors({})}
                      className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {/* File Preview */}
              {selectedFiles.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="relative inline-block">
                        {file.type.startsWith('image/') ? (
                          <div className="relative">
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              width={80}
                              height={60}
                              className="rounded-lg max-w-[80px] max-h-[60px] object-cover"
                              unoptimized
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-shrink-0">
                              {file.type === 'application/pdf' ? (
                                <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                                  <span className="text-red-600 dark:text-red-400 text-xs font-medium">PDF</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                                  <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">DOC</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="Attach files to message"
                  />
                                      <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                      title="Attach file"
                      aria-label="Attach file to message"
                      disabled={uploading}
                    >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex-1 relative">
                  <div className="flex items-end bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all duration-200">
                    <textarea
                      placeholder={t('writeMessage')}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      rows={1}
                      className="flex-1 p-3 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none resize-none text-sm max-h-32"
                      style={{ minHeight: '44px' }}
                    />
                    <button
                      onClick={handleSendMessageWithAttachments}
                      disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
                      className="m-1 p-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 flex-shrink-0"
                      title={sending || uploading ? t('sending') : t('sendMessage')}
                    >
                      {sending || uploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center text-gray-500">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('selectConversation')}</h3>
              <p className="text-sm">{t('selectConversationDesc')}</p>
            </div>
          </div>
        )}
      </div>
      
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
        message={t('confirmBlockUser')}
        itemName={selectedConversation ? (
          Number(session?.user?.id) === selectedConversation.buyer.id
            ? selectedConversation.seller.username
            : selectedConversation.buyer.username
        ) : undefined}
        isLoading={isActionLoading}
        loadingText={t('common:processing', 'Processing...')}
        confirmText={t('blockUser')}
        cancelText={t('cancel')}
        type="warning"
      />

      <DeleteConfirmationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={confirmReportUser}
        title={t('reportUser')}
        message={t('confirmReportUser')}
        itemName={selectedConversation ? (
          Number(session?.user?.id) === selectedConversation.buyer.id
            ? selectedConversation.seller.username
            : selectedConversation.buyer.username
        ) : undefined}
        isLoading={isActionLoading}
        loadingText={t('common:processing', 'Processing...')}
        confirmText={t('reportUser')}
        cancelText={t('cancel')}
        type="warning"
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteConversation}
        title={t('deleteConversation')}
        message={t('confirmDeleteConversation')}
        itemName={selectedConversation ? (
          `${selectedConversation.listingBrand} ${selectedConversation.listingModel} ${selectedConversation.listingYear}`
        ) : undefined}
        isLoading={isActionLoading}
        loadingText={t('common:deleting', 'Deleting...')}
        confirmText={t('deleteConversation')}
        cancelText={t('cancel')}
        type="danger"
      />
    </div>
  );
}
