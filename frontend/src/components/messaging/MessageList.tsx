'use client';

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageResponse, ConversationResponse } from '@/services/messaging';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import MessageBubble from './MessageBubble';
import Image from 'next/image';

interface MessageListProps {
  selectedConversation: ConversationResponse;
  messages: MessageResponse[];
  currentUserId: number;
  isRTL: boolean;
  otherPersonTyping: boolean;
  onDownloadDocument: (fileKey: string, fileName: string) => void;
}

export default function MessageList({
  selectedConversation,
  messages,
  currentUserId,
  isRTL,
  otherPersonTyping,
  onDownloadDocument
}: MessageListProps) {
  const { t } = useTranslation('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <ChatHeader conversation={selectedConversation} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">{t('noMessages')}</p>
              <p className="text-xs mt-1">{t('startConversation')}</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender.id === currentUserId}
                isRTL={isRTL}
                onDownloadDocument={onDownloadDocument}
              />
            ))}
            
            {/* Typing Indicator */}
            {otherPersonTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 max-w-xs">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {t('typing')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  conversation: ConversationResponse;
}

function ChatHeader({ conversation }: ChatHeaderProps) {
  const { t } = useTranslation('messages');

  return (
    <div className="flex items-center gap-3">
      {/* Listing Image */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
          {conversation.listingImageUrl ? (
            <Image
              src={transformMinioUrl(conversation.listingImageUrl)}
              alt={`${conversation.listingBrand} ${conversation.listingModel}`}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
              onError={(e) => {
                e.currentTarget.src = getDefaultImageUrl();
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => window.open(`/listings/${conversation.listingId}`, '_blank')}
          className="text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 -m-2 transition-colors w-full"
          title={t('viewListing')}
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {conversation.listingBrand} {conversation.listingModel} {conversation.listingYear}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {conversation.buyer.username} • {conversation.seller.username}
            </p>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              ${conversation.listingPrice}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
