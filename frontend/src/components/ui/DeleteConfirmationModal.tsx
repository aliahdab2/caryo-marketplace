'use client';

import React from 'react';
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { useLanguageDirection } from '@/utils/languageDirection';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  isLoading?: boolean;
  loadingText?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
  className?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
  loadingText = 'Deleting...',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  className = ''
}) => {
  const { isRTL } = useLanguageDirection();

  if (!isOpen) return null;

  const getIcon = () => {
    if (type === 'warning') {
      return <FaExclamationTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
    }
    return <FaTrash className="h-6 w-6 text-red-600 dark:text-red-400" />;
  };

  const getIconBg = () => {
    if (type === 'warning') {
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    }
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getConfirmButtonBg = () => {
    if (type === 'warning') {
      return 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400';
    }
    return 'bg-red-600 hover:bg-red-700 disabled:bg-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${isRTL ? 'rtl' : 'ltr'} ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${getIconBg()} mb-4`}>
              {getIcon()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {message}
            </p>
            {itemName && (
              <p className="font-medium text-gray-900 dark:text-gray-100 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                &quot;{itemName}&quot;
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-3 ${getConfirmButtonBg()} text-white font-medium rounded-xl transition-colors duration-200 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {loadingText}
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 