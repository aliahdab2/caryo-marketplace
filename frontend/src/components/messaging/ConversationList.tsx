'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { ConversationResponse } from '@/services/messaging';
import { transformMinioUrl, getDefaultImageUrl } from '@/utils/mediaUtils';
import Image from 'next/image';

interface ConversationListProps {
  conversations: ConversationResponse[];
  selectedConversation: ConversationResponse | null;
  onConversationSelect: (conversation: ConversationResponse) => void;
  onToggleSidebar: () => void;
  onShowDropdown: () => void;
  showSidebar: boolean;
  loading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  onToggleSidebar,
  onShowDropdown,
  showSidebar,
  loading
}: ConversationListProps) {
  const { t, i18n } = useTranslation('messages');
  const isRTL = i18n.language === 'ar';

  if (loading) {
    return (
      <div className="lg:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${showSidebar ? 'block' : 'hidden'} lg:block lg:w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('conversations')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowDropdown}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('moreOptions')}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={t('closeSidebar')}
          >
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">{t('noConversations')}</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => onConversationSelect(conversation)}
                isRTL={isRTL}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: ConversationResponse;
  isSelected: boolean;
  onClick: () => void;
  isRTL: boolean;
}

function ConversationItem({ conversation, isSelected, onClick, isRTL: _isRTL }: ConversationItemProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Listing Image */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {conversation.listingImageUrl ? (
              <Image
                src={transformMinioUrl(conversation.listingImageUrl)}
                alt={`${conversation.listingBrand} ${conversation.listingModel}`}
                width={48}
                height={48}
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
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {conversation.listingBrand} {conversation.listingModel} {conversation.listingYear}
            </h3>
            {conversation.lastMessageAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                {formatTime(conversation.lastMessageAt)}
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            {conversation.buyer.username} • {conversation.seller.username}
          </p>
          
          {conversation.recentMessages && conversation.recentMessages.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {conversation.recentMessages[0].content}
            </p>
          )}
          
          {conversation.unreadCount > 0 && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {conversation.unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
