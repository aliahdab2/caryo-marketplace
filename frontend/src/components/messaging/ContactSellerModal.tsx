'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MessagingService } from '@/services/messaging';
// Using native HTML elements with Tailwind styling
import { MessageCircle, Send, X } from 'lucide-react';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle: string;
  sellerName: string;
}

export default function ContactSellerModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  sellerName,
}: ContactSellerModalProps) {
  const { data: session } = useSession();
  const { t } = useTranslation('messages');
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default message when modal opens
  React.useEffect(() => {
    if (isOpen && !message) {
      setMessage(t('defaultMessage', { listingTitle }));
      setSubject(t('defaultSubject', { listingTitle }));
    }
  }, [isOpen, listingTitle, message, t]);

  const handleSendMessage = async () => {
    if (!session?.user) {
      // Redirect to login
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }

    if (!message.trim()) {
      setError(t('errorEmptyMessage'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create conversation and send initial message
      const conversation = await MessagingService.createConversation({
        listingId,
        initialMessage: message.trim(),
        subject: subject.trim() || undefined,
        messageType: 'TEXT',
      });

      // Close modal and redirect to messages
      onClose();
      router.push(`/dashboard/messages?conversation=${conversation.id}`);
    } catch (error: unknown) {
      console.error('Error creating conversation:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(errorMessage || t('errorSendMessage'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage('');
      setSubject('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('contactSeller')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t('contactSellerDesc', { sellerName })}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('subject')} ({t('optional')})
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('subjectPlaceholder')}
              disabled={loading}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('message')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('messagePlaceholder')}
              disabled={loading}
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/1000 {t('characters')}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Login prompt for non-authenticated users */}
          {!session?.user && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {t('loginRequired')}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            {t('cancel')}
          </button>
          <button
            onClick={handleSendMessage}
            disabled={loading || !message.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? t('sending') : t('sendMessage')}
          </button>
        </div>
      </div>
    </div>
  );
}
